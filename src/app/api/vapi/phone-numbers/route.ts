import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { VapiClient } from '@/lib/vapi-client';

// Define the phone number interface
interface PhoneNumber {
  id?: number;
  business_id: string;
  vapi_phone_id: string;
  provider: string;
  name?: string;
  sip_uri?: string;
  assistant_id?: string;
  created_at?: string;
  updated_at?: string;
}

// GET: Retrieve all phone numbers for the current business
export async function GET(request: NextRequest) {
  try {
    // Use request cookies for authentication
    const cookieStore = request.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the business profile for the user
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (businessError || !businessProfile) {
      console.error('Business profile error:', businessError);
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    // Get all phone numbers for this business
    const { data: phoneNumbers, error: phoneNumbersError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('business_id', businessProfile.id)
      .order('created_at', { ascending: false });

    if (phoneNumbersError) {
      console.error('Error fetching phone numbers:', phoneNumbersError);
      return NextResponse.json({ 
        error: 'Failed to fetch phone numbers', 
        details: phoneNumbersError.message 
      }, { status: 500 });
    }

    // Also fetch from Vapi API to ensure data is up to date
    try {
      const vapiClient = new VapiClient({ token: process.env.VAPI_API_KEY || 'mock-api-key' });
      const vapiPhoneNumbers = await vapiClient.phoneNumbers.list();
      
      console.log('Fetched phone numbers from Vapi:', vapiPhoneNumbers);
      
      // Sync the Vapi data with our database
      if (vapiPhoneNumbers && vapiPhoneNumbers.length > 0 && phoneNumbers && phoneNumbers.length > 0) {
        for (const dbPhone of phoneNumbers) {
          const vapiPhone = vapiPhoneNumbers.find(vp => vp.id === dbPhone.vapi_phone_id);
          if (vapiPhone) {
            // Update the phone number with the latest data from Vapi
            const { error: updateError } = await supabase
              .from('phone_numbers')
              .update({
                number: vapiPhone.number || dbPhone.number,
                status: vapiPhone.status || dbPhone.status || 'active',
                sip_uri: vapiPhone.sipUri || dbPhone.sip_uri,
                updated_at: new Date().toISOString()
              })
              .eq('id', dbPhone.id);
            
            if (updateError) {
              console.error(`Error updating phone number ${dbPhone.id}:`, updateError);
            }
            
            // Update the local object for the response
            dbPhone.number = vapiPhone.number || dbPhone.number;
            dbPhone.status = vapiPhone.status || dbPhone.status || 'active';
            dbPhone.sip_uri = vapiPhone.sipUri || dbPhone.sip_uri;
          }
        }
      }
    } catch (vapiError) {
      console.error('Error fetching from Vapi API:', vapiError);
      // Continue with database data
    }

    return NextResponse.json(phoneNumbers || []);
  } catch (error) {
    console.error('Error retrieving phone numbers:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
}

// POST: Create a new phone number
export async function POST(request: NextRequest) {
  try {
    // Use request cookies for authentication
    const cookieStore = request.cookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the business profile for the user
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (businessError || !businessProfile) {
      console.error('Business profile error:', businessError);
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    // Check if the business already has a phone number
    const { data: existingPhoneNumbers, error: phoneNumbersError } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('business_id', businessProfile.id);
    
    if (phoneNumbersError) {
      console.error('Error checking existing phone numbers:', phoneNumbersError);
      return NextResponse.json({ 
        error: 'Failed to check existing phone numbers', 
        details: phoneNumbersError.message 
      }, { status: 500 });
    }
    
    // If the business already has a phone number, return an error
    if (existingPhoneNumbers && existingPhoneNumbers.length > 0) {
      return NextResponse.json({ 
        error: 'Multiple phone numbers not allowed', 
        message: 'You already have a phone number. To request additional phone numbers, please contact admin@wecallsmart.com.',
        code: 'ONE_PHONE_PER_BUSINESS'
      }, { status: 403 });
    }

    // Parse the request body
    const phoneNumberData = await request.json();
    console.log('Received phone number data:', JSON.stringify(phoneNumberData, null, 2));

    // Validate required fields
    if (!phoneNumberData.provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    // Create the phone number in Vapi
    try {
      const vapiClient = new VapiClient({ token: process.env.VAPI_API_KEY || 'mock-api-key' });
      
      // Prepare the data for Vapi
      const vapiData: any = {
        provider: phoneNumberData.provider,
        name: phoneNumberData.name || `${businessProfile.business_name} Phone`,
      };
      
      // If an assistant ID is provided, include it
      if (phoneNumberData.assistant_id) {
        vapiData.assistantId = phoneNumberData.assistant_id;
      }
      
      // Handle different providers
      if (phoneNumberData.provider === 'vapi') {
        // For Vapi provider, we don't need to specify a number
        // The API will provision a number for us
        // DO NOT include phone property
        
        // Optionally, if you want to specify an area code for the US number
        if (phoneNumberData.numberDesiredAreaCode) {
          vapiData.numberDesiredAreaCode = phoneNumberData.numberDesiredAreaCode;
        }
      } 
      else if (phoneNumberData.provider === 'twilio') {
        // For Twilio provider, we need to provide the Twilio credentials
        if (phoneNumberData.twilioAccountSid) {
          vapiData.twilioAccountSid = phoneNumberData.twilioAccountSid;
        }
        if (phoneNumberData.twilioAuthToken) {
          vapiData.twilioAuthToken = phoneNumberData.twilioAuthToken;
        }
        // If a specific number is provided
        if (phoneNumberData.number) {
          vapiData.number = phoneNumberData.number;
        }
      } 
      else if (phoneNumberData.provider === 'byo-phone-number') {
        // For BYO phone number, we need to provide the actual number in E.164 format
        if (phoneNumberData.number) {
          // Ensure number is in E.164 format (e.g., +12345678901)
          let formattedNumber = phoneNumberData.number;
          if (!formattedNumber.startsWith('+')) {
            formattedNumber = `+${formattedNumber}`;
          }
          vapiData.number = formattedNumber;
          
          // Set numberE164CheckEnabled to true to enforce E.164 format validation
          vapiData.numberE164CheckEnabled = true;
        }
      }
      
      console.log('Creating phone number with Vapi data:', vapiData);
      
      try {
        const vapiPhoneNumber = await vapiClient.phoneNumbers.create(vapiData);
        
        // Only proceed if we have a valid phone number from Vapi
        if (!vapiPhoneNumber || !vapiPhoneNumber.id) {
          throw new Error('Failed to create phone number: Invalid response from Vapi API');
        }
        
        console.log('Created phone number in Vapi:', vapiPhoneNumber);

        // Store the phone number in our database
        const { data: newPhoneNumber, error: insertError } = await supabase
          .from('phone_numbers')
          .insert({
            business_id: businessProfile.id,
            vapi_phone_id: vapiPhoneNumber.id,
            provider: vapiPhoneNumber.provider,
            name: vapiPhoneNumber.name,
            sip_uri: vapiPhoneNumber.sipUri || null,
            assistant_id: phoneNumberData.assistant_id,
            number: vapiPhoneNumber.number || null,
            status: vapiPhoneNumber.status || 'active'
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error saving phone number to database:', insertError);
          
          // Try to delete the phone number from Vapi if we couldn't save it to our database
          try {
            await vapiClient.phoneNumbers.delete(vapiPhoneNumber.id);
            console.log('Deleted phone number from Vapi due to database error');
          } catch (deleteError) {
            console.error('Error deleting phone number from Vapi:', deleteError);
          }
          
          return NextResponse.json({ 
            error: 'Failed to save phone number', 
            details: insertError.message 
          }, { status: 500 });
        }

        return NextResponse.json(newPhoneNumber);
      } catch (vapiError: any) {
        console.error('Error calling Vapi API:', vapiError);
        
        // Check if this is an area code unavailability error
        if (vapiError.error === 'Area code unavailable') {
          // If the area code is unavailable, try to get suggested area codes
          let suggestedAreaCodes: string[] = [];
          
          // If the error already includes suggested area codes, use those
          if (vapiError.suggestedAreaCodes && Array.isArray(vapiError.suggestedAreaCodes)) {
            suggestedAreaCodes = vapiError.suggestedAreaCodes;
          } else {
            // Use a small set of common area codes as fallback suggestions
            suggestedAreaCodes = ['212', '213', '312', '415', '516', '646', '917'];
          }
          
          // Return a structured error response with suggested area codes
          return NextResponse.json({
            error: 'Area code unavailable',
            message: vapiError.message || 'This area code is currently not available.',
            suggestedAreaCodes
          }, { status: 400 });
        }
        
        // For other errors, return a generic error response
        return NextResponse.json({
          error: vapiError.message || 'Failed to create phone number',
        }, { status: 400 });
      }
    } catch (error) {
      console.error('Error in phone number creation process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ 
        error: 'Internal server error', 
        details: errorMessage 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating phone number:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
} 
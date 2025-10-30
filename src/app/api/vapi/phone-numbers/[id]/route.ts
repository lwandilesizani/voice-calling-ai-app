import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { VapiClient } from '@/lib/vapi-client';

// GET: Retrieve a specific phone number
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
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

    // Get the phone number
    const { data: phoneNumber, error: phoneNumberError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessProfile.id)
      .single();

    if (phoneNumberError) {
      console.error('Error fetching phone number:', phoneNumberError);
      return NextResponse.json({ 
        error: 'Failed to fetch phone number', 
        details: phoneNumberError.message 
      }, { status: 500 });
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Also fetch from Vapi API to ensure data is up to date
    try {
      const vapiClient = new VapiClient({ token: process.env.VAPI_API_KEY || 'mock-api-key' });
      const vapiPhoneNumber = await vapiClient.phoneNumbers.get(phoneNumber.vapi_phone_id);
      
      console.log('Fetched phone number from Vapi:', vapiPhoneNumber);
      
      // In a real implementation, we would update our database with the latest Vapi data
      // For now, we'll just return the database data
    } catch (vapiError) {
      console.error('Error fetching from Vapi API:', vapiError);
      // Continue with database data
    }

    return NextResponse.json(phoneNumber);
  } catch (error) {
    console.error('Error retrieving phone number:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
}

// PATCH: Update a phone number
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
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

    // Get the existing phone number
    const { data: existingPhoneNumber, error: phoneNumberError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessProfile.id)
      .single();

    if (phoneNumberError || !existingPhoneNumber) {
      console.error('Error fetching phone number:', phoneNumberError);
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Parse the request body
    const updateData = await request.json();
    console.log('Received update data:', JSON.stringify(updateData, null, 2));

    // Update the phone number in Vapi
    try {
      const vapiClient = new VapiClient({ token: process.env.VAPI_API_KEY || 'mock-api-key' });
      
      // Format the data for Vapi API
      const vapiUpdateData: any = {};
      
      // Only include fields that are provided
      if (updateData.name !== undefined) {
        vapiUpdateData.name = updateData.name || existingPhoneNumber.name;
      }
      
      if (updateData.assistant_id !== undefined) {
        vapiUpdateData.assistantId = updateData.assistant_id === "none" ? null : updateData.assistant_id;
      }
      
      console.log('Updating phone number in Vapi with data:', vapiUpdateData);
      
      const vapiPhoneNumber = await vapiClient.phoneNumbers.update(
        existingPhoneNumber.vapi_phone_id, 
        vapiUpdateData
      );
      
      console.log('Updated phone number in Vapi:', vapiPhoneNumber);
      
      // Update the phone number in our database
      const { data: updatedPhoneNumber, error: updateError } = await supabase
        .from('phone_numbers')
        .update({
          name: updateData.name || existingPhoneNumber.name,
          assistant_id: updateData.assistant_id === "none" ? null : updateData.assistant_id,
          number: vapiPhoneNumber.number || existingPhoneNumber.number,
          status: vapiPhoneNumber.status || existingPhoneNumber.status || 'active',
          sip_uri: vapiPhoneNumber.sipUri || existingPhoneNumber.sip_uri,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating phone number in database:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update phone number', 
          details: updateError.message 
        }, { status: 500 });
      }

      return NextResponse.json(updatedPhoneNumber);
    } catch (vapiError) {
      console.error('Error updating phone number in Vapi:', vapiError);
      return NextResponse.json({ 
        error: 'Failed to update phone number in Vapi', 
        details: vapiError instanceof Error ? vapiError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating phone number:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
}

// DELETE: Delete a phone number
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
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

    // Get the existing phone number
    const { data: existingPhoneNumber, error: phoneNumberError } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('id', id)
      .eq('business_id', businessProfile.id)
      .single();

    if (phoneNumberError || !existingPhoneNumber) {
      console.error('Error fetching phone number:', phoneNumberError);
      return NextResponse.json({ error: 'Phone number not found' }, { status: 404 });
    }

    // Delete the phone number from Vapi
    try {
      const vapiClient = new VapiClient({ token: process.env.VAPI_API_KEY || 'mock-api-key' });
      await vapiClient.phoneNumbers.delete(existingPhoneNumber.vapi_phone_id);
      
      console.log('Deleted phone number from Vapi:', existingPhoneNumber.vapi_phone_id);
      
      // Delete the phone number from our database
      const { error: deleteError } = await supabase
        .from('phone_numbers')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting phone number from database:', deleteError);
        return NextResponse.json({ 
          error: 'Failed to delete phone number', 
          details: deleteError.message 
        }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } catch (vapiError) {
      console.error('Error deleting phone number from Vapi:', vapiError);
      return NextResponse.json({ 
        error: 'Failed to delete phone number from Vapi', 
        details: vapiError instanceof Error ? vapiError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting phone number:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
} 
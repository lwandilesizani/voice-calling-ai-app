import { NextResponse } from 'next/server';
import { getAvailability, createBooking } from '@/lib/cal';
import { CallLogService } from '@/lib/services/call-logs';
import { LeadsService } from '@/lib/services/leads';
import { EmailService } from '@/lib/services/email';
import { SettingsService } from '@/lib/services/settings';
import { createServiceClient } from '@/lib/supabase/service';
import { Database } from '@/lib/supabase/types';
import { z } from 'zod';

// Schema for the Vapi tool call request
const requestSchema = z.object({
  message: z.object({
    type: z.enum(['tool-calls', 'end-of-call-report']),
    toolCalls: z.array(z.object({
      id: z.string(),
      type: z.literal('function'),
      function: z.object({
        name: z.string(),
        arguments: z.record(z.any())
      })
    })).optional(),
    endedReason: z.string().optional(),
    transcript: z.string().optional(),
    summary: z.string().optional(),
    messages: z.array(z.any()).optional(),
    call: z.object({
      id: z.string()
    }).optional()
  })
});

// Schema for booking arguments
const bookingArgsSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  company: z.string(),
  phone: z.string(),
  timezone: z.string(),
  notes: z.string().optional(),
  startTime: z.string()
});

// Schema for availability arguments
const availabilityArgsSchema = z.object({
  timezone: z.string()
});

// Schema for business service booking arguments
const businessServiceBookingArgsSchema = z.object({
  service_id: z.string(),
  customer_name: z.string(),
  customer_email: z.string().email(),
  customer_phone: z.string(),
  booking_date: z.string(),
  booking_time: z.string(),
  notes: z.string().optional()
});

// Schema for business availability arguments
const businessAvailabilityArgsSchema = z.object({
  service_id: z.string(),
  start_date: z.string(),
  timezone: z.string(),
  end_date: z.string().optional()
});

// Helper function to convert local time to UTC
function localToUTC(dateStr: string, timezone: string): string {
  const date = new Date(dateStr);
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const diff = utcDate.getTime() - localDate.getTime();
  return new Date(date.getTime() + diff).toISOString();
}

// Helper function to convert UTC to local time
function utcToLocal(dateStr: string, timezone: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', { timeZone: timezone });
}

// Validate request authentication
function validateApiKey(request: Request) {
  const apiKey = request.headers.get('x-vapi-secret');
  
  // Check if the API key is valid
  if (!apiKey) {
    console.log('No API key provided');
    return false;
  }
  
  // In development, also accept 'test-secret' for testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isValidKey = apiKey === process.env.VAPI_SECRET_KEY;
  const isTestKey = isDevelopment && apiKey === 'test-secret';
  
  if (!isValidKey && !isTestKey) {
    console.log('Invalid API key provided:', apiKey);
    console.log('Expected:', process.env.VAPI_SECRET_KEY);
    return false;
  }
  
  return true;
}

// Identify business from call context
async function identifyBusinessFromCall(supabaseClient: any, callData: any): Promise<string | null> {
  // Try to get business from phone number
  if (callData?.phoneNumber) {
    console.log('Trying to identify business from phone number:', callData.phoneNumber);
    const { data: phoneData, error: phoneError } = await supabaseClient
      .from('phone_numbers')
      .select('business_id')
      .eq('number', callData.phoneNumber)
      .single();
      
    if (!phoneError && phoneData?.business_id) {
      console.log('Found business from phone number:', phoneData.business_id);
      return phoneData.business_id;
    }
  }
  
  // Try to get business from assistant ID
  if (callData?.assistantId) {
    console.log('Trying to identify business from assistant ID:', callData.assistantId);
    
    // First check phone_numbers table which links assistant_id to business_id
    const { data: phoneAssistantData, error: phoneAssistantError } = await supabaseClient
      .from('phone_numbers')
      .select('business_id')
      .eq('assistant_id', callData.assistantId)
      .single();
      
    if (!phoneAssistantError && phoneAssistantData?.business_id) {
      console.log('Found business from phone_numbers.assistant_id:', phoneAssistantData.business_id);
      return phoneAssistantData.business_id;
    }
    
    // Then check assistants table
    const { data: assistantData, error: assistantError } = await supabaseClient
      .from('assistants')
      .select('business_profile_id')
      .eq('vapi_assistant_id', callData.assistantId)
      .single();
      
    if (!assistantError && assistantData?.business_profile_id) {
      console.log('Found business from assistants.vapi_assistant_id:', assistantData.business_profile_id);
      return assistantData.business_profile_id;
    }
  }
  
  // If we can't identify the business, log a warning and return null
  console.warn('Could not identify business from call data:', callData);
  return null;
}

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadStatus = Lead['status'];
type LeadUpdate = Partial<Pick<Lead, 'status' | 'cal_booking_uid' | 'follow_up_email_sent'>>;

export async function POST(request: Request) {
  try {
    // Log request details for debugging
    const requestBody = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    console.log('VAPI Request:', {
      method: request.method,
      url: request.url,
      headers,
      body: JSON.stringify(requestBody, null, 2)
    });

    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json({
        results: [{
          toolCallId: '',
          result: 'Error: Unauthorized: Invalid API key'
        }]
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse and validate request body
    const parsedRequest = requestSchema.parse(requestBody);
    
    // Create service instances with the service role client
    const supabaseServiceClient = createServiceClient();
    const callLogService = new CallLogService(supabaseServiceClient);
    const leadsService = new LeadsService(supabaseServiceClient);
    const settingsService = new SettingsService(supabaseServiceClient);
    
    // Extract call data for business identification
    const callData = {
      phoneNumber: requestBody.call?.to || requestBody.message?.call?.to,
      assistantId: requestBody.assistant?.id || requestBody.message?.assistant?.id
    };
    
    // Identify the business from the call data
    const businessId = await identifyBusinessFromCall(supabaseServiceClient, callData);
    
    // Store the business ID in a context object that will be passed to tool handlers
    const context = {
      businessId
    };
    
    console.log('Call context:', context);
    
    // Common headers for all tool API calls
    const toolApiHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Business-Context': JSON.stringify(context)
    };
    
    // Add phone number and assistant ID to headers if available
    if (callData.phoneNumber) {
      toolApiHeaders['X-Phone-Number'] = callData.phoneNumber;
    }
    
    if (callData.assistantId) {
      toolApiHeaders['X-Assistant-ID'] = callData.assistantId;
    }

    // Handle end-of-call-report
    if (parsedRequest.message.type === 'end-of-call-report') {
      const callId = requestBody.message.call?.id;
      if (!callId) {
        console.warn('No call ID found in end-of-call report:', JSON.stringify(requestBody, null, 2));
        return NextResponse.json({}, { status: 200 });
      }

      // Update call log and get the lead_id
      const { data: updatedCallLog, error: updateError } = await callLogService.updateWithReport(callId, requestBody);
      if (updateError || !updatedCallLog) {
        console.error('Error updating call log with report:', updateError);
        return NextResponse.json({}, { status: 200 });
      }

      // Get the status from the report
      const status: LeadStatus = (requestBody.message.analysis?.structuredData?.['outcome'] ?? 'error') as LeadStatus;
      
      // Only update if we got a valid status and have a lead_id
      if (updatedCallLog.lead_id && (status === 'no_answer' || status === 'scheduled' || status === 'not_interested')) {
        // For scheduled status, extract booking UID from the report
        const updateData: LeadUpdate = { status };
        
        if (status === 'scheduled') {
          const bookingResult = requestBody.message.analysis?.structuredData?.['booking_result'];
          if (bookingResult?.status === 'success' && bookingResult?.data?.uid) {
            updateData.cal_booking_uid = bookingResult.data.uid;
            console.log(`Updating lead with Cal.com booking UID: ${bookingResult.data.uid}`);
          } else {
            console.warn('Scheduled status but no valid booking UID found:', bookingResult);
          }
        }

        const { success, error: leadUpdateError, data: lead } = await leadsService.updateLead(updatedCallLog.lead_id, updateData);
        if (!success) {
          console.error('Error updating lead status:', leadUpdateError);
        }

        // Get the current automation settings
        const settings = await settingsService.getAutomationSettings();

        // Send follow-up email for not_interested immediately, or for no_answer only when max attempts reached
        // Also ensure we haven't sent a follow-up email already
        if (lead && !lead.follow_up_email_sent && (
          status === 'not_interested' || 
          (status === 'no_answer' && lead.call_attempts >= settings.max_attempts)
        )) {
          try {
            const emailService = new EmailService();
            const emailResult = await emailService.sendFollowUpEmail({
              name: lead.contact_name,
              email: lead.email,
              company: lead.company_name
            }, status);

            // Only mark the email as sent if Resend confirms successful delivery
            if (emailResult.error === null) {
              const emailUpdate: LeadUpdate = { follow_up_email_sent: true };
              const { error: updateError } = await leadsService.updateLead(lead.id, emailUpdate);
              
              if (updateError) {
                console.error('Error updating follow_up_email_sent flag:', updateError);
              } else {
                console.log(`Follow-up email sent and flag updated for lead ${lead.email} with status ${status}`);
              }
            } else {
              console.error('Error sending follow-up email:', emailResult.error);
            }
          } catch (emailError) {
            console.error('Error in email sending process:', emailError);
          }
        } else if (status === 'no_answer') {
          const reason = lead?.follow_up_email_sent 
            ? 'follow-up email already sent'
            : `attempts (${lead?.call_attempts}/${settings.max_attempts}) not reached max`;
          console.log(`No follow-up email sent for ${lead?.email}: ${reason}`);
        }
      } else {
        console.warn('Invalid status or missing lead_id. Status:', status, 'Lead ID:', updatedCallLog.lead_id);
      }
      
      return NextResponse.json({}, { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle tool calls
    if (parsedRequest.message.type === 'tool-calls' && parsedRequest.message.toolCalls) {
      const toolCall = parsedRequest.message.toolCalls[0];
      const toolCallId = toolCall.id;
      const functionName = toolCall.function.name;
      
      console.log(`Processing tool call: ${functionName}`);
      console.log(`Tool call arguments:`, JSON.stringify(toolCall.function.arguments, null, 2));
      console.log(`Tool call context:`, JSON.stringify(context, null, 2));
      
    switch (functionName) {
      case 'check_availability': {
        let availabilityArgs;
        try {
          const args = toolCall.function.arguments;
          availabilityArgs = availabilityArgsSchema.parse(args);
        } catch {
          return NextResponse.json({
            results: [{
              toolCallId,
              result: 'Error: Invalid availability arguments. Timezone is required.'
            }]
          }, { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const result = await getAvailability(5);
        if (!result.success) {
          return NextResponse.json({
            results: [{
              toolCallId,
              result: `Error: ${result.error}`
            }]
          }, { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Convert UTC slots to local time
        const localSlots = result.availability?.slots.map(slot => ({
          ...slot,
          time: utcToLocal(slot.time, availabilityArgs.timezone)
        })) || [];

        return NextResponse.json({
          results: [{
            toolCallId,
            result: {
              availableSlots: localSlots,
              timezone: availabilityArgs.timezone
            }
          }]
        }, { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      case 'book_appointment': {
        let bookingDetails;
        try {
          const args = toolCall.function.arguments;
          const parsedArgs = bookingArgsSchema.parse(args);
          
          // Convert local time to UTC for cal.com
          bookingDetails = {
            ...parsedArgs,
            startTime: localToUTC(parsedArgs.startTime, parsedArgs.timezone)
          };
        } catch (error) {
          console.error('Error parsing booking details:', error);
          return NextResponse.json({
            results: [{
              toolCallId,
              result: 'Error: Invalid booking details provided. Required fields: name, email, company, phone, timezone, startTime'
            }]
          }, { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const result = await createBooking(bookingDetails);
        if (!result.success) {
          return NextResponse.json({
            results: [{
              toolCallId,
              result: `Error: ${result.error}`
            }]
          }, { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        return NextResponse.json({
          results: [{
            toolCallId,
            result: `Successfully booked appointment for ${bookingDetails.name} at ${bookingDetails.startTime}`
          }]
        }, { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // New tool: get_business_info
      case 'get_business_info': {
        try {
          console.log('Executing get_business_info tool');
          
            // Get the base URL with fallback
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7ae14e7d-9684-4ad1-86c0-42a0a3abda47-00-1q4kt89zrpvu0.riker.replit.dev';
            
            // Make a request to our booking tools API with the business context
            const response = await fetch(`${baseUrl}/api/vapi/booking-tools/get_business_info`, {
              method: 'POST',
              headers: toolApiHeaders
            });
            
            if (!response.ok) {
              throw new Error(`Failed to get business info: ${response.statusText}`);
            }
            
            const data = await response.json();
          
          return NextResponse.json({
            results: [{
              toolCallId,
                result: data
            }]
          }, { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error getting business info:', error);
          return NextResponse.json({
            results: [{
              toolCallId,
                result: `Error: ${error instanceof Error ? error.message : 'Failed to get business info'}`
            }]
          }, { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // New tool: list_business_services
      case 'list_business_services': {
        try {
          console.log('Executing list_business_services tool');
          
          // Instead of forwarding to another endpoint, handle the request directly
          // Get the business ID from the context
          const businessId = context.businessId;
          console.log(`Processing list_business_services for business ID: ${businessId}`);
          
          // Query the database directly
          const { data: services, error: servicesError } = await supabaseServiceClient
            .from('services')
            .select('*')
            .eq('business_profile_id', businessId)
            .order('name');
          
          if (servicesError) {
            console.error('Error fetching services:', servicesError);
            throw new Error(`Failed to list business services: ${servicesError.message}`);
          }
          
          // Format the response
          const formattedServices = services.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description || '',
            duration: service.duration,
            price: service.price
          }));
          
          console.log(`Found ${formattedServices.length} services for business ID: ${businessId}`);
          
          return NextResponse.json({
            results: [{
              toolCallId,
              result: formattedServices
            }]
          }, { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error listing business services:', error);
          return NextResponse.json({
            results: [{
              toolCallId,
              result: `Error: ${error instanceof Error ? error.message : 'Failed to list business services'}`
            }]
          }, { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // New tool: book_business_service
      case 'book_business_service': {
        try {
          console.log('Executing book_business_service tool');
            
            // Get the base URL with fallback
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7ae14e7d-9684-4ad1-86c0-42a0a3abda47-00-1q4kt89zrpvu0.riker.replit.dev';
          
          const args = toolCall.function.arguments;
          console.log('Booking arguments:', args);
          
            // Validate the booking arguments
            const bookingArgs = businessServiceBookingArgsSchema.parse(args);
            
            // Make a request to our booking tools API with the business context
            const response = await fetch(`${baseUrl}/api/vapi/booking-tools/book_business_service`, {
              method: 'POST',
              headers: toolApiHeaders,
              body: JSON.stringify(bookingArgs)
            });
            
            if (!response.ok) {
              throw new Error(`Failed to book business service: ${response.statusText}`);
            }
            
            const data = await response.json();
          
          return NextResponse.json({
            results: [{
              toolCallId,
                result: data
            }]
          }, { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error booking business service:', error);
          return NextResponse.json({
            results: [{
              toolCallId,
                result: `Error: ${error instanceof Error ? error.message : 'Failed to book business service'}`
            }]
          }, { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // New tool: get_business_availability
      case 'get_business_availability': {
        try {
          console.log('Executing get_business_availability tool');
            
            // Get the base URL with fallback
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7ae14e7d-9684-4ad1-86c0-42a0a3abda47-00-1q4kt89zrpvu0.riker.replit.dev';
          
          const args = toolCall.function.arguments;
          console.log('Availability arguments:', args);
          
          const availabilityArgs = businessAvailabilityArgsSchema.parse(args);
          
            // Make a request to our booking tools API with the business context
            const response = await fetch(`${baseUrl}/api/vapi/booking-tools/get_business_availability`, {
              method: 'POST',
              headers: toolApiHeaders,
              body: JSON.stringify(availabilityArgs)
            });
            
            if (!response.ok) {
              throw new Error(`Failed to get business availability: ${response.statusText}`);
            }
            
            const data = await response.json();
          
          return NextResponse.json({
            results: [{
              toolCallId,
                result: data
            }]
          }, { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error getting business availability:', error);
          return NextResponse.json({
            results: [{
              toolCallId,
              result: `Error: ${error instanceof Error ? error.message : 'Failed to get availability'}`
            }]
          }, { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // New tool: get_customer_bookings
      case 'get_customer_bookings': {
        try {
          console.log('Executing get_customer_bookings tool');
            
          // Get the base URL with fallback
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7ae14e7d-9684-4ad1-86c0-42a0a3abda47-00-1q4kt89zrpvu0.riker.replit.dev';
          
          const args = toolCall.function.arguments;
          console.log('Customer bookings arguments:', args);
          
          // Make a request to our booking tools API with the business context
          const response = await fetch(`${baseUrl}/api/vapi/booking-tools/get_customer_bookings`, {
            method: 'POST',
            headers: toolApiHeaders,
            body: JSON.stringify(args)
          });
            
          if (!response.ok) {
            throw new Error(`Failed to get customer bookings: ${response.statusText}`);
          }
            
          const data = await response.json();
          
          return NextResponse.json({
            results: [{
              toolCallId,
              result: data
            }]
          }, { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error getting customer bookings:', error);
          return NextResponse.json({
            results: [{
              toolCallId,
              result: `Error: ${error instanceof Error ? error.message : 'Failed to get customer bookings'}`
            }]
          }, { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // New tool: update_booking
      case 'update_booking': {
        try {
          console.log('Executing update_booking tool');
            
          // Get the base URL with fallback
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7ae14e7d-9684-4ad1-86c0-42a0a3abda47-00-1q4kt89zrpvu0.riker.replit.dev';
          
          const args = toolCall.function.arguments;
          console.log('Update booking arguments:', args);
          
          // Make a request to our booking tools API with the business context
          const response = await fetch(`${baseUrl}/api/vapi/booking-tools/update_booking`, {
            method: 'POST',
            headers: toolApiHeaders,
            body: JSON.stringify(args)
          });
            
          if (!response.ok) {
            throw new Error(`Failed to update booking: ${response.statusText}`);
          }
            
          const data = await response.json();
          
          return NextResponse.json({
            results: [{
              toolCallId,
              result: data
            }]
          }, { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error updating booking:', error);
          return NextResponse.json({
            results: [{
              toolCallId,
              result: `Error: ${error instanceof Error ? error.message : 'Failed to update booking'}`
            }]
          }, { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      default:
        return NextResponse.json({
          results: [{
            toolCallId,
            result: `Error: Invalid function name: ${functionName}`
          }]
        }, { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({
      results: [{
        toolCallId: '',
        result: error instanceof Error ? error.message : 'An unexpected error occurred'
      }]
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

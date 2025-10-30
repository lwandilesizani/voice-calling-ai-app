import { NextResponse, NextRequest } from 'next/server'
import { SettingsService, DEFAULT_SETTINGS } from '@/lib/services/settings'
import { LeadsService } from '@/lib/services/leads'
import { CallLogService } from '@/lib/services/call-logs'
import type { Lead } from '@/lib/supabase/types'
import { createServiceClient } from '@/lib/supabase/service'

if (!process.env.VAPI_API_KEY) throw new Error('VAPI_API_KEY is required')
if (!process.env.VAPI_ASSISTANT_ID) throw new Error('VAPI_ASSISTANT_ID is required')
if (!process.env.VAPI_PHONE_NUMBER_ID) throw new Error('VAPI_PHONE_NUMBER_ID is required')
if (!process.env.CRON_SECRET) throw new Error('CRON_SECRET is required')

// Create service instances with the service role client
const serviceClient = createServiceClient()
const settingsService = new SettingsService(serviceClient)
const leadsService = new LeadsService(serviceClient)
const callLogService = new CallLogService(serviceClient)

// Fetch automation settings from Supabase
async function getAutomationSettings() {
  console.log('Fetching automation settings...');
  try {
    const settings = await settingsService.getAutomationSettings();
    // console.log('Settings retrieved:', settings);
    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return {
      automation_enabled: false,
      max_calls_batch: DEFAULT_SETTINGS.max_calls_batch,
      retry_interval: DEFAULT_SETTINGS.retry_interval,
      max_attempts: DEFAULT_SETTINGS.max_attempts
    }
  }
}

// Initiate a VAPI call
async function initiateVapiCall(lead: Lead) {
  console.log(`Initiating VAPI call for lead:`, lead);
  
  // Get current time in lead's timezone
  const leadDateTime = new Date().toLocaleString('en-US', { 
    timeZone: lead.timezone || 'America/Los_Angeles',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
  
  const payload = {
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    assistantId: process.env.VAPI_ASSISTANT_ID,
    assistantOverrides: {
      variableValues: {
        lead_company_name: lead.company_name,
        lead_contact_name: lead.contact_name,
        lead_email: lead.email,
        lead_phone_number: lead.phone,
        lead_timezone: lead.timezone || 'America/Los_Angeles',
        lead_datetime: leadDateTime
      }
    },
    customer: {
      number: lead.phone
    }
  };
  console.log('VAPI request payload:', payload);

  const response = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })

  const responseData = await response.text();
  console.log(`VAPI API response (${response.status}):`, responseData);

  if (!response.ok) {
    throw new Error(`Failed to initiate VAPI call: ${response.status} ${response.statusText} - ${responseData}`)
  }

  return JSON.parse(responseData);
}

export async function GET(request: NextRequest) {
  try {
    console.log('Cron job started');
    
    // Verify cron authentication
    const authHeader = request.headers.get('authorization');
    console.log('Auth header present:', !!authHeader);
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get automation settings
    const settings = await getAutomationSettings()
    // console.log('Automation settings:', settings);

    if (!settings.automation_enabled) {
      console.log('Automation is disabled, exiting');
      return NextResponse.json({ message: 'Automation is disabled' })
    }

    // Use default values if settings properties are undefined
    const maxCallsBatch = settings.max_calls_batch ?? DEFAULT_SETTINGS.max_calls_batch;
    const retryInterval = settings.retry_interval ?? DEFAULT_SETTINGS.retry_interval;
    const maxAttempts = settings.max_attempts ?? DEFAULT_SETTINGS.max_attempts;

    // Fetch leads to process
    console.log('Fetching pending leads...');
    const { success, leads, error: fetchError } = await leadsService.fetchPendingLeads(maxCallsBatch, retryInterval, maxAttempts)

    if (!success || !leads) {
      console.log('Error fetching leads:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    console.log(`Found ${leads?.length || 0} leads to process`);
    if (leads.length === 0) {
      return NextResponse.json({ message: 'No leads to process' })
    }

    // Initiate calls for each lead
    console.log('Processing leads...');
    const results = await Promise.all(
      leads.map(async (lead) => {
        try {
          // Start VAPI call
          const callResult = await initiateVapiCall(lead)

          // Create call log
          const { error: logError } = await callLogService.createCallLog(lead.id, callResult)
          if (logError) {
            console.error('Error creating call log:', logError)
          }

          // Update lead with call attempt
          const { success, error: updateError } = await leadsService.updateLeadWithCallAttempt(lead.id, lead.call_attempts)

          if (!success) {
            console.log('Error updating lead:', updateError)
            return { lead, success: false, error: updateError }
          }

          return { lead, success: true, callId: callResult.id }
        } catch (error) {
          console.log(`Error processing lead ${lead.id}:`, error)
          return { lead, success: false, error }
        }
      })
    )

    // Prepare summary
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }

    return NextResponse.json({
      message: 'Calls initiated',
      summary,
      details: results
    })
  } catch (error) {
    console.log('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

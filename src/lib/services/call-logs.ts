/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from '@supabase/supabase-js'
import { supabase as defaultClient } from '@/lib/supabase/client'

export type CallLog = {
  id: string
  lead_id: string
  vapi_call_id: string
  initiated_at: string | null
  ended_at: string | null
  ended_reason: string | null
  recording_url: string | null
  stereo_recording_url: string | null
  duration_seconds: number | null
  cost: number | null
  initial_response: any // Type will be refined based on VAPI's response
  report: any // Type will be refined based on VAPI's end-of-call report
  created_at: string
  updated_at: string
}

export class CallLogService {
  private supabase: SupabaseClient

  constructor(supabaseClient: SupabaseClient = defaultClient) {
    this.supabase = supabaseClient
  }

  async createCallLog(leadId: string, vapiResponse: any): Promise<{ data: CallLog | null; error: any }> {
    const { data, error } = await this.supabase
      .from('call_logs')
      .insert([{
        lead_id: leadId,
        vapi_call_id: vapiResponse.id,
        initial_response: vapiResponse,
        initiated_at: vapiResponse.createdAt,
        status: 'initiated'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating call log:', error)
    }

    return { data, error }
  }

  async updateWithReport(vapiCallId: string, report: any): Promise<{ data: CallLog | null; error: any }> {
    const { data, error } = await this.supabase
      .from('call_logs')
      .update({
        ended_at: report.message.endedAt,
        ended_reason: report.message.endedReason,
        recording_url: report.message.artifact?.recordingUrl,
        stereo_recording_url: report.message.artifact?.stereoRecordingUrl,
        duration_seconds: report.message.durationSeconds,
        cost: report.message.cost,
        report
      })
      .eq('vapi_call_id', vapiCallId)
      .select()
      .single()

    if (error) {
      console.error('Error updating call log with report:', error)
    }

    return { data, error }
  }

  async getCallsForLead(leadId: string): Promise<{ data: CallLog[] | null; error: any }> {
    const { data, error } = await this.supabase
      .from('call_logs')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching calls for lead:', error)
    }

    return { data, error }
  }

  async getActiveCall(leadId: string): Promise<{ data: CallLog | null; error: any }> {
    const { data, error } = await this.supabase
      .from('call_logs')
      .select('*')
      .eq('lead_id', leadId)
      .is('ended_at', null)
      .single()

    if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
      console.error('Error fetching active call:', error)
    }

    return { data, error }
  }
}

// Export a singleton instance with the default client for client-side use
export const callLogService = new CallLogService()

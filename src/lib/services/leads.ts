/* eslint-disable @typescript-eslint/no-explicit-any */
// TODO: Add types
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '@/lib/supabase/client';
import type { Lead } from '@/lib/supabase/types';

export type LeadStatus = "pending" | "calling" | "no_answer" | "scheduled" | "not_interested";

export class LeadsService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient = defaultClient) {
    this.supabase = supabaseClient;
  }

  async getLeads(
    options: {
      sortBy?: { column: keyof Lead | null; ascending: boolean };
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ data: Lead[] | null; error: any; count: number }> {
    const { sortBy, page, pageSize } = options;
    
    try {
      let query = this.supabase
        .from('leads')
        .select('*', { count: 'exact' });

      // Only apply sorting if we have a valid column
      if (sortBy?.column) {
        query = query.order(sortBy.column, {
          ascending: sortBy.ascending
        });
      } else {
        // Default sort by created_at desc if no sort specified
        query = query.order('created_at', { ascending: false });
      }

      // Only apply pagination if both page and pageSize are provided
      if (typeof page === 'number' && typeof pageSize === 'number') {
        // Convert from 1-based to 0-based page number
        const start = (page - 1) * pageSize;
        query = query.range(start, start + pageSize - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching leads:', error);
        return {
          data: null,
          error: {
            message: error.message || 'Failed to fetch leads',
            details: error
          },
          count: 0
        };
      }

      return {
        data,
        error: null,
        count: count || 0
      };
    } catch (error) {
      console.error('Error fetching leads:', error);
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
          details: error
        },
        count: 0
      };
    }
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<{ success: boolean; data?: Lead | null; error?: any }> {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error updating lead:', error);
      return {
        success: false,
        error
      };
    }
  }

  async deleteLead(id: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await this.supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting lead:', error);
      return {
        success: false,
        error
      };
    }
  }

  async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Lead | null; error?: any }> {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .insert([lead])
        .select()
        .single();

      if (error) throw error;

      return {
        data
      };
    } catch (error) {
      console.error('Error creating lead:', error);
      return {
        data: null,
        error
      };
    }
  }

  async createLeads(leads: Omit<Lead, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await this.supabase
        .from('leads')
        .insert(leads);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      console.error('Error creating leads:', error);
      return {
        success: false,
        error
      };
    }
  }

  async updateLeadStatus(ids: string[], status: Lead['status']): Promise<{ success: boolean; data?: Lead[] | null; error?: any }> {
    try {
      const { data, error } = await this.supabase
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ids)
        .select();

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error updating lead status:', error);
      return {
        success: false,
        error
      };
    }
  }

  // Update call status by phone number
  async updateCallStatus(phoneNumber: string, status: Lead['status']): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await this.supabase
        .from('leads')
        .update({ 
          status,
          last_called_at: new Date().toISOString()
        })
        .eq('phone', phoneNumber)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating call status:', error);
      return { success: false, error };
    }
  }

  // Fetch pending leads that need to be called
  async fetchPendingLeads(maxCallsBatch: number, retryInterval: number, maxAttempts: number): Promise<{ 
    success: boolean; 
    leads?: Lead[] | null; 
    error?: any 
  }> {
    try {
      // First count how many leads are currently being called
      const { count: activeCallsCount, error: countError } = await this.supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'calling');

      if (countError) throw countError;

      // Calculate how many new calls we can make
      const availableSlots = Math.max(0, maxCallsBatch - (activeCallsCount || 0));

      // If no slots available, return empty array
      if (availableSlots === 0) {
        return {
          success: true,
          leads: []
        };
      }

      const query = this.supabase
        .from('leads')
        .select('*')
        .eq('status', 'pending')
        .or(`last_called_at.is.null,last_called_at.lt.${new Date(Date.now() - retryInterval * 60 * 1000).toISOString()}`)
        .lt('call_attempts', maxAttempts)
        .order('last_called_at', { ascending: true, nullsFirst: true })
        .limit(availableSlots);

      console.log('Fetching pending leads with conditions:', {
        status: 'pending',
        retryIntervalMinutes: retryInterval,
        maxAttempts,
        maxCallsBatch,
        activeCallsCount,
        availableSlots,
        retryTime: new Date(Date.now() - retryInterval * 60 * 1000).toISOString()
      });

      const { data: leads, error } = await query;

      if (error) throw error;

      return {
        success: true,
        leads
      };
    } catch (error) {
      console.error('Error fetching pending leads:', error);
      return {
        success: false,
        error
      };
    }
  }

  // Update lead with new call attempt
  async updateLeadWithCallAttempt(leadId: string, currentAttempts: number): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await this.supabase
        .from('leads')
        .update({ 
          call_attempts: currentAttempts + 1,
          last_called_at: new Date().toISOString(),
          status: 'calling'
        })
        .eq('id', leadId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating lead call attempt:', error);
      return { success: false, error };
    }
  }
}

// Export a singleton instance with the default client for client-side use
export const leadsService = new LeadsService();

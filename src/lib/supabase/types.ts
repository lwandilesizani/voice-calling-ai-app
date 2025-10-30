export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          company_name: string
          contact_name: string
          phone: string
          email: string
          status: 'pending' | 'calling' | 'no_answer' | 'scheduled' | 'not_interested' | 'error'
          call_attempts: number
          timezone: string
          last_called_at: string | null
          cal_booking_uid: string | null
          follow_up_email_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['leads']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['leads']['Row']>
      }
      settings: {
        Row: {
          id: string
          automation_enabled: boolean
          max_calls_batch: number
          retry_interval: number
          max_attempts: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['settings']['Row']>
      }
      bookings: {
        Row: {
          id: string
          business_id: string
          service_id: string
          customer_name: string
          customer_email: string
          customer_phone: string
          booking_date: string
          booking_time: string
          notes: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Row']>
      }
      booking_details: {
        Row: {
          id: string
          business_id: string
          service_id: string
          customer_name: string
          customer_email: string
          customer_phone: string
          booking_date: string
          booking_time: string
          notes: string | null
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          service_name: string
          service_price: number
          service_duration: number
          service_category: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['booking_details']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['booking_details']['Row']>
      }
      business_profiles: {
        Row: {
          id: string
          user_id: string
          business_name: string
          business_type: string
          email: string
          phone: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          profile_image_url: string | null
          profile_image_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['business_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['business_profiles']['Row']>
      }
      services: {
        Row: {
          id: string
          business_id: string
          name: string
          price: number
          description: string | null
          duration: number
          category: string | null
          custom_duration: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['services']['Row']>
      }
      profiles: {
        Row: {
          id: number
          user_id: number
          bio: string | null
          updated_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      users: {
        Row: {
          id: number
          email: string
          created_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['users']['Row']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      booking_status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
      business_type: string
    }
  }
}

// Convenience type for Lead table rows
export type Lead = Database['public']['Tables']['leads']['Row']

// Convenience type for Booking table rows
export type Booking = Database['public']['Tables']['bookings']['Row'] & {
  service?: Database['public']['Tables']['services']['Row']
}

// Convenience type for Service table rows
export type Service = Database['public']['Tables']['services']['Row']

// Convenience type for Business Profile table rows
export type BusinessProfile = Database['public']['Tables']['business_profiles']['Row']

// Convenience type for Profile table rows
export type Profile = Database['public']['Tables']['profiles']['Row']

// Convenience type for User table rows
export type User = Database['public']['Tables']['users']['Row']

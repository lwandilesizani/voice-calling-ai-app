import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Creates a Supabase client for server-side API routes.
 * This is specifically for route handlers, not middleware.
 */
export async function createRouteHandlerClient() {
  try {
    // Get the cookies from the request
    const cookieStore = await cookies();
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            // Use synchronous API after awaiting cookieStore
            const cookie = cookieStore.get(name)
            return cookie?.value
          },
          set(name, value, options) {
            // Use synchronous API after awaiting cookieStore
            cookieStore.set(name, value, options)
          },
          remove(name, options) {
            // Use synchronous API after awaiting cookieStore
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          },
        }
      }
    )
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}

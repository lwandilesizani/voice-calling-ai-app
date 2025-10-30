import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

// Create a singleton instance using Supabase SSR for browser
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Debug auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase Auth State Change:', { 
    event, 
    hasSession: !!session,
    accessToken: session?.access_token ? 'present' : 'missing',
  });
});

// Export a function to check auth state
export const getAuthDebugInfo = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();
  
  return {
    session,
    user,
    error,
    hasValidSession: !!session?.access_token,
    accessToken: session?.access_token ? 'present' : 'missing',
  };
};

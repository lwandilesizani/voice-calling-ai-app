import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// GET: Retrieve all assistants for the current business
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

    // Get all assistant configs for this business
    const { data: assistantConfigs, error: assistantError } = await supabase
      .from('assistant_configs')
      .select('*')
      .eq('business_id', businessProfile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (assistantError) {
      console.error('Error fetching assistants:', assistantError);
      return NextResponse.json({ 
        error: 'Failed to fetch assistants', 
        details: assistantError.message 
      }, { status: 500 });
    }

    // Get all assistants from the assistants table
    const { data: assistantsData, error: assistantsError } = await supabase
      .from('assistants')
      .select('id, name, vapi_assistant_id')
      .eq('business_profile_id', businessProfile.id)
      .is('is_template', false)
      .order('created_at', { ascending: false });

    if (assistantsError) {
      console.error('Error fetching assistants data:', assistantsError);
    }

    // Create a map of assistant IDs to names from the assistants table
    const assistantNameMap = new Map();
    if (assistantsData && assistantsData.length > 0) {
      assistantsData.forEach(assistant => {
        if (assistant.vapi_assistant_id) {
          assistantNameMap.set(assistant.vapi_assistant_id, assistant.name);
        }
        // Also map by the assistant's own ID
        assistantNameMap.set(assistant.id, assistant.name);
      });
    }

    // Transform the data to match the expected format
    const assistants = assistantConfigs.map(config => {
      // Try to find the assistant name from the map, or use a fallback
      let assistantName = 'Unnamed Assistant';
      
      if (assistantNameMap.has(config.assistant_id)) {
        assistantName = assistantNameMap.get(config.assistant_id);
      } else {
        // If we can't find it in our map, try to extract a name from the business profile
        assistantName = `${businessProfile.business_name || 'Business'} Assistant`;
      }
      
      return {
        id: config.id,
        assistantId: config.assistant_id,
        name: assistantName,
        model: config.model,
        isActive: config.is_active
      };
    });

    return NextResponse.json(assistants || []);
  } catch (error) {
    console.error('Error retrieving assistants:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

// DELETE: Delete an assistant from Vapi
export async function DELETE(request: NextRequest) {
  try {
    // Get the assistant ID from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const assistantId = searchParams.get('id');
    
    console.log('Deleting assistant with ID:', assistantId);
    
    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }
    
    // Create a Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get the user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the business profile for the current user
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (businessError || !businessProfile) {
      console.error('Error getting business profile:', businessError);
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }
    
    // Get the assistant config to verify ownership
    const { data: assistantConfig, error: configError } = await supabase
      .from('assistant_configs')
      .select('*')
      .eq('business_id', businessProfile.id)
      .eq('assistant_id', assistantId)
      .single();
    
    if (configError || !assistantConfig) {
      console.error('Error getting assistant config:', configError);
      return NextResponse.json({ error: 'Assistant not found or not owned by this business' }, { status: 404 });
    }
    
    // Delete the assistant from Vapi
    const vapiResponse = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
      }
    });
    
    console.log('Vapi API response status:', vapiResponse.status);
    
    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { error: errorText || 'Unknown error from Vapi API' };
      }
      console.error('Vapi API error:', errorData);
      
      // If the assistant doesn't exist on Vapi, we still want to update our database
      if (vapiResponse.status !== 404) {
        return NextResponse.json({ 
          error: 'Failed to delete assistant from Vapi',
          details: errorData,
          status: vapiResponse.status
        }, { status: 500 });
      }
    }
    
    // Update the assistant config in the database
    const { data: updatedConfig, error: updateError } = await supabase
      .from('assistant_configs')
      .update({
        assistant_id: null,
        is_active: false
      })
      .eq('business_id', businessProfile.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating assistant config:', updateError);
      return NextResponse.json({ error: 'Failed to update assistant config' }, { status: 500 });
    }
    
    // Return success
    return NextResponse.json({ 
      success: true,
      message: 'Assistant deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// GET: Retrieve assistant details from Vapi
export async function GET(request: NextRequest) {
  try {
    // Get the assistant ID from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const assistantId = searchParams.get('id');
    
    console.log('Fetching assistant details for ID:', assistantId);
    
    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }
    
    // Get the assistant details from Vapi
    console.log('Making request to Vapi API:', `https://api.vapi.ai/assistant/${assistantId}`);
    console.log('Using API key:', process.env.VAPI_API_KEY ? 'Present (not showing for security)' : 'Missing');
    
    const vapiResponse = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
      }
    });
    
    console.log('Vapi API response status:', vapiResponse.status);
    
    if (!vapiResponse.ok) {
      const errorData = await vapiResponse.json().catch(() => ({}));
      console.error('Vapi API error:', errorData);
      return NextResponse.json({ error: 'Failed to get assistant details from Vapi' }, { status: 500 });
    }
    
    const vapiData = await vapiResponse.json();
    console.log('Vapi API response data:', JSON.stringify(vapiData, null, 2));
    
    // Return the assistant details
    return NextResponse.json(vapiData);
  } catch (error) {
    console.error('Error getting assistant details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
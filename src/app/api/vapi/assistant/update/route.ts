import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import fs from 'fs/promises';
import path from 'path';

// Helper function to load tool IDs from vapi-config.json
async function loadToolIds() {
  try {
    const configPath = path.join(process.cwd(), 'vapi', 'vapi-config.json');
    console.log('Loading tool IDs from:', configPath);
    
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    // Log the loaded tool IDs for debugging
    console.log('Loaded tool IDs from config:', JSON.stringify(config.toolIds, null, 2));
    
    return config.toolIds || {};
  } catch (error) {
    console.error('Error loading tool IDs:', error);
    // Return empty object instead of throwing, so the assistant update can still proceed
    // even if tool IDs cannot be loaded
    return {};
  }
}

// POST: Update an assistant on Vapi
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { assistantId, config } = body;
    
    console.log('Updating assistant with ID:', assistantId);
    console.log('Using configuration:', JSON.stringify(config, null, 2));
    
    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }
    
    if (!config) {
      return NextResponse.json({ error: 'Configuration is required' }, { status: 400 });
    }
    
    // Load tool IDs from vapi-config.json
    let toolIdsArray: string[] = [];
    try {
      const toolIds = await loadToolIds();
      toolIdsArray = Object.values(toolIds).filter(id => id) as string[];
      console.log('Tool IDs loaded for update:', toolIdsArray);
    } catch (error) {
      console.error('Error processing tool IDs for update:', error);
      // Continue without tool IDs if there's an error
    }
    
    // Validate required fields
    const requiredFields = ['model', 'temperature', 'maxTokens', 'transcriptionLanguage', 
                           'transcriptionModel', 'voiceProvider', 'voiceId', 
                           'firstMessage', 'systemPrompt'];
    
    const missingFields = requiredFields.filter(field => !config[field as keyof typeof config]);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }
    
    // Get business name from the database if available
    let businessName = 'Business';
    try {
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
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get the business profile for the user
        const { data: businessProfile } = await supabase
          .from('business_profiles')
          .select('business_name')
          .eq('user_id', user.id)
          .single();
        
        if (businessProfile?.business_name) {
          businessName = businessProfile.business_name;
        }
      }
    } catch (error) {
      console.error('Error getting business name:', error);
      // Continue with default business name
    }
    
    // Try to load the business-specific system prompt
    let systemPrompt = config.systemPrompt;
    try {
      const promptPath = path.join(process.cwd(), 'vapi', 'prompts', 'business-system-prompt.md');
      const promptTemplate = await fs.readFile(promptPath, 'utf8');
      
      // Replace placeholders with actual business data
      systemPrompt = promptTemplate.replace(/\{\{business_name\}\}/g, businessName);
      
      console.log('Loaded custom system prompt template for update');
    } catch (error) {
      console.error('Error loading system prompt template for update:', error);
      // Continue with the provided system prompt if there's an error
    }
    
    // Try to load the business-specific first message
    let firstMessage = config.firstMessage;
    try {
      const messagePath = path.join(process.cwd(), 'vapi', 'prompts', 'business-first-message.txt');
      const messageTemplate = await fs.readFile(messagePath, 'utf8');
      
      // Replace placeholders with actual business data
      firstMessage = messageTemplate.replace(/\{\{business_name\}\}/g, businessName);
      
      console.log('Loaded custom first message template for update');
    } catch (error) {
      console.error('Error loading first message template for update:', error);
      // Continue with the provided first message if there's an error
    }
    
    // Prepare the update payload
    const updatePayload = {
      name: `${businessName} Assistant`,
      model: {
        provider: 'openai',
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        toolIds: toolIdsArray
      },
      voice: {
        provider: config.voiceProvider.toLowerCase(),
        voiceId: config.voiceId
      },
      transcriber: {
        provider: 'deepgram',
        language: config.transcriptionLanguage,
        model: config.transcriptionModel.split(' @ ')[0].toLowerCase()
      },
      firstMessage: firstMessage,
      firstMessageMode: 'assistant-speaks-first'
    };
    
    console.log('Update payload:', JSON.stringify(updatePayload, null, 2));
    console.log('Making request to Vapi API:', `https://api.vapi.ai/assistant/${assistantId}`);
    console.log('API Key present:', !!process.env.VAPI_API_KEY);
    
    if (!process.env.VAPI_API_KEY) {
      console.error('VAPI_API_KEY is missing in environment variables');
      return NextResponse.json({ 
        error: 'API key configuration error', 
        details: 'VAPI_API_KEY is missing' 
      }, { status: 500 });
    }
    
    // Update the assistant on Vapi
    const vapiResponse = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
      },
      body: JSON.stringify(updatePayload)
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
      return NextResponse.json({ 
        error: 'Failed to update assistant on Vapi',
        details: errorData,
        status: vapiResponse.status
      }, { status: 500 });
    }
    
    const vapiData = await vapiResponse.json();
    console.log('Vapi API response data:', JSON.stringify(vapiData, null, 2));
    
    // Return the updated assistant
    return NextResponse.json(vapiData);
  } catch (error) {
    console.error('Error updating assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
} 
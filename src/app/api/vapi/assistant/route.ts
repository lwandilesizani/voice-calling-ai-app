import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

// Define the assistant configuration interface
interface AssistantConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  transcriptionLanguage: string;
  transcriptionModel: string;
  voiceProvider: string;
  voiceId: string;
  firstMessage: string;
  systemPrompt: string;
  isActive: boolean;
  assistantId?: string;
}

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
    // Return empty object instead of throwing, so the assistant creation can still proceed
    // even if tool IDs cannot be loaded
    return {};
  }
}

// GET: Retrieve the current assistant configuration
export async function GET(request: NextRequest) {
  try {
    // Use request cookies instead
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the business profile for the user
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (businessError || !businessProfile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    // Get the assistant configuration for the business
    const { data: assistantConfig, error: configError } = await supabase
      .from('assistant_configs')
      .select('*')
      .eq('business_id', businessProfile.id)
      .single();

    if (configError && configError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return NextResponse.json({ error: 'Failed to retrieve assistant configuration' }, { status: 500 });
    }

    // Return the configuration or an empty object if none exists
    return NextResponse.json(assistantConfig || {});
  } catch (error) {
    console.error('Error retrieving assistant configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Save the assistant configuration
export async function POST(request: NextRequest) {
  try {
    // Use request cookies instead
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

    // Parse the request body
    const config = await request.json();
    console.log('Received config:', JSON.stringify(config, null, 2));

    // Ensure business_id is set correctly
    if (!config.business_id) {
      config.business_id = businessProfile.id;
      console.log('Setting business_id from profile:', businessProfile.id);
    }

    // Validate required fields
    const requiredFields = ['model', 'temperature', 'max_tokens', 'transcription_language', 
                           'transcription_model', 'voice_provider', 'voice_id', 
                           'first_message', 'system_prompt'];
    
    const missingFields = requiredFields.filter(field => !config[field]);
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // First check if a record already exists for this business
    const { data: existingConfig, error: queryError } = await supabase
      .from('assistant_configs')
      .select('id')
      .eq('business_id', config.business_id)
      .single();

    let result;
    
    if (existingConfig) {
      console.log('Updating existing config with ID:', existingConfig.id);
      // Update the existing record
      const { data, error } = await supabase
        .from('assistant_configs')
        .update({
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          transcription_language: config.transcription_language,
          transcription_model: config.transcription_model,
          voice_provider: config.voice_provider,
          voice_id: config.voice_id,
          first_message: config.first_message,
          system_prompt: config.system_prompt,
          is_active: config.is_active,
          assistant_id: config.assistant_id
        })
        .eq('id', existingConfig.id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating assistant configuration:', error);
        return NextResponse.json({ 
          error: 'Failed to update assistant configuration', 
          details: error.message 
        }, { status: 500 });
      }
      
      result = data;
    } else {
      console.log('Creating new config for business_id:', config.business_id);
      // Insert a new record
      const { data, error } = await supabase
        .from('assistant_configs')
        .insert({
          business_id: config.business_id,
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.max_tokens,
          transcription_language: config.transcription_language,
          transcription_model: config.transcription_model,
          voice_provider: config.voice_provider,
          voice_id: config.voice_id,
          first_message: config.first_message,
          system_prompt: config.system_prompt,
          is_active: config.is_active,
          assistant_id: config.assistant_id
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating assistant configuration:', error);
        return NextResponse.json({ 
          error: 'Failed to create assistant configuration', 
          details: error.message 
        }, { status: 500 });
      }
      
      result = data;
    }

    console.log('Successfully saved configuration:', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving assistant configuration:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
}

// PUT: Create and activate the assistant
export async function PUT(request: NextRequest) {
  try {
    // Use request cookies instead
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the business profile for the user
    const { data: businessProfile, error: businessError } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (businessError || !businessProfile) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    // Get the current assistant configuration
    const { data: assistantConfig, error: configError } = await supabase
      .from('assistant_configs')
      .select('*')
      .eq('business_id', businessProfile.id)
      .single();

    // Create a default configuration if one doesn't exist
    let config = assistantConfig;
    if (!config || configError?.code === 'PGRST116') { // PGRST116 is "no rows returned"
      // Default configuration
      const defaultConfig = {
        business_id: businessProfile.id,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 300,
        transcription_language: 'en',
        transcription_model: 'Nova @ General',
        voice_provider: 'Cartesia',
        voice_id: '248be419-c632-4f23-adf1-5324ed7dbf1d',
        first_message: 'Hi, this is Ava. How may I assist you today?',
        system_prompt: 'You are Ava, an AI assistant for a business. Be helpful, professional, and patient with customers. Use the available tools to provide accurate information about the business, its services, and handle bookings. Always use real business data from the database instead of making assumptions.',
        is_active: false
      };

      // Insert the default configuration
      const { data: newConfig, error: insertError } = await supabase
        .from('assistant_configs')
        .insert(defaultConfig)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default configuration:', insertError);
        return NextResponse.json({ error: 'Failed to create assistant configuration' }, { status: 500 });
      }

      config = newConfig;
    }

    // Load tool IDs from vapi-config.json
    let toolIdsArray: string[] = [];
    try {
      const toolIds = await loadToolIds();
      toolIdsArray = Object.values(toolIds).filter(id => id) as string[];
      console.log('Tool IDs loaded:', toolIdsArray);
    } catch (error) {
      console.error('Error processing tool IDs:', error);
      // Continue without tool IDs if there's an error
    }

    // Create the assistant using the Vapi API
    console.log('Creating assistant with Vapi API...');
    console.log('API Key:', process.env.VAPI_API_KEY ? 'Present (not showing for security)' : 'Missing');
    
    // Try to load the business-specific system prompt
    let systemPrompt = config.system_prompt;
    try {
      const promptPath = path.join(process.cwd(), 'vapi', 'prompts', 'business-system-prompt.md');
      const promptTemplate = await fs.readFile(promptPath, 'utf8');
      
      // Replace placeholders with actual business data
      systemPrompt = promptTemplate.replace(/\{\{business_name\}\}/g, businessProfile.business_name);
      
      console.log('Loaded custom system prompt template');
      
      // Update the configuration with the new system prompt
      // This ensures the database has the latest template-based system prompt
      const { error: updateError } = await supabase
        .from('assistant_configs')
        .update({
          system_prompt: systemPrompt
        })
        .eq('business_id', businessProfile.id);
      
      if (updateError) {
        console.error('Error updating system prompt in config:', updateError);
        // Continue with the loaded system prompt even if update fails
      } else {
        console.log('Updated system prompt in database with template-based prompt');
      }
    } catch (error) {
      console.error('Error loading system prompt template:', error);
      // Continue with the default system prompt if there's an error
    }
    
    // Try to load the business-specific first message
    let firstMessage = config.first_message;
    try {
      const messagePath = path.join(process.cwd(), 'vapi', 'prompts', 'business-first-message.txt');
      const messageTemplate = await fs.readFile(messagePath, 'utf8');
      
      // Replace placeholders with actual business data
      firstMessage = messageTemplate.replace(/\{\{business_name\}\}/g, businessProfile.business_name);
      
      console.log('Loaded custom first message template');
      
      // Update the configuration with the new first message
      // This ensures the database has the latest template-based message
      const { error: updateError } = await supabase
        .from('assistant_configs')
        .update({
          first_message: firstMessage
        })
        .eq('business_id', businessProfile.id);
      
      if (updateError) {
        console.error('Error updating first message in config:', updateError);
        // Continue with the loaded first message even if update fails
      } else {
        console.log('Updated first message in database with template-based message');
      }
    } catch (error) {
      console.error('Error loading first message template:', error);
      // Continue with the default first message if there's an error
    }
    
    const vapiRequestBody = {
      name: `${businessProfile.business_name} Assistant`,
      model: {
        provider: 'openai',
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        toolIds: toolIdsArray // Add the tool IDs to the model configuration
      },
      voice: {
        provider: config.voice_provider.toLowerCase(),
        voiceId: config.voice_id
      },
      transcriber: {
        provider: 'deepgram',
        language: config.transcription_language,
        model: config.transcription_model.split(' @ ')[0].toLowerCase()
      },
      firstMessage: firstMessage,
      firstMessageMode: 'assistant-speaks-first'
    };
    
    console.log('Request body:', JSON.stringify(vapiRequestBody, null, 2));
    
    const vapiResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
      },
      body: JSON.stringify(vapiRequestBody)
    });

    console.log('Vapi API response status:', vapiResponse.status);
    
    if (!vapiResponse.ok) {
      const errorData = await vapiResponse.json();
      console.error('Vapi API error:', errorData);
      return NextResponse.json({ error: 'Failed to create assistant with Vapi' }, { status: 500 });
    }

    const vapiData = await vapiResponse.json();
    const assistantId = vapiData.id;

    // Update the configuration with the assistant ID
    const { data, error } = await supabase
      .from('assistant_configs')
      .update({
        assistant_id: assistantId,
        is_active: true
      })
      .eq('business_id', businessProfile.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating assistant_configs:', error);
      return NextResponse.json({ error: 'Failed to update assistant configuration' }, { status: 500 });
    }
    
    // Also save the assistant in the assistants table
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .insert({
        business_profile_id: businessProfile.id,
        name: `${businessProfile.business_name} Assistant`,
        description: 'Business assistant created via Vapi',
        vapi_assistant_id: assistantId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_template: false
      })
      .select()
      .single();
    
    if (assistantError) {
      console.error('Error saving to assistants table:', assistantError);
      // Continue even if this fails, as we've already updated the assistant_configs table
    } else {
      console.log('Assistant saved to assistants table:', assistantData);
    }

    // Return the updated configuration
    return NextResponse.json({
      assistantId,
      config: data
    });
  } catch (error) {
    console.error('Error activating assistant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
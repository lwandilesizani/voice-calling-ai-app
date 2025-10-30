import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function extractBusinessContext(request: NextRequest) {
  // Extract business context from headers
  const contextHeader = request.headers.get('X-Business-Context');
  let businessId = null;
  
  if (contextHeader) {
    try {
      const context = JSON.parse(contextHeader);
      businessId = context.businessId;
      console.log('Extracted business ID from context:', businessId);
    } catch (error) {
      console.error('Error parsing business context:', error);
    }
  }
  
  // If no business ID in context, try to extract from other sources
  if (!businessId) {
    // Try to get from phone number if available
    const phoneNumber = request.headers.get('X-Phone-Number');
    if (phoneNumber) {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('phone_numbers')
        .select('business_id')
        .eq('number', phoneNumber)
        .single();
        
      if (!error && data?.business_id) {
        businessId = data.business_id;
        console.log('Extracted business ID from phone number:', businessId);
      }
    }
    
    // Try to get from assistant ID if available
    const assistantId = request.headers.get('X-Assistant-ID');
    if (assistantId && !businessId) {
      const supabase = createServiceClient();
      
      // First check phone_numbers table
      const { data: phoneData, error: phoneError } = await supabase
        .from('phone_numbers')
        .select('business_id')
        .eq('assistant_id', assistantId)
        .single();
        
      if (!phoneError && phoneData?.business_id) {
        businessId = phoneData.business_id;
        console.log('Extracted business ID from phone_numbers.assistant_id:', businessId);
      } else {
        // Then check assistants table
        const { data: assistantData, error: assistantError } = await supabase
          .from('assistants')
          .select('business_profile_id')
          .eq('vapi_assistant_id', assistantId)
          .single();
          
        if (!assistantError && assistantData?.business_profile_id) {
          businessId = assistantData.business_profile_id;
          console.log('Extracted business ID from assistants.vapi_assistant_id:', businessId);
        }
      }
    }
    
    // Try to get from assistant_configs table if available
    if (!businessId) {
      const supabase = createServiceClient();
      
      // Get the most recently activated assistant
      const { data: assistantConfig, error: assistantConfigError } = await supabase
        .from('assistant_configs')
        .select('business_id')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
        
      if (!assistantConfigError && assistantConfig?.business_id) {
        businessId = assistantConfig.business_id;
        console.log('Extracted business ID from most recent active assistant config:', businessId);
      }
    }
  }
  
  if (!businessId) {
    console.warn('No business ID found in context or other sources, using fallback');
    
    // As a last resort, get the first business in the database
    const supabase = createServiceClient();
    const { data: businessData, error: businessError } = await supabase
      .from('business_profiles')
      .select('id')
      .limit(1)
      .single();
      
    if (!businessError && businessData?.id) {
      businessId = businessData.id;
      console.log('Using fallback business ID:', businessId);
    }
  }
  
  return businessId;
} 
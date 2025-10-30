import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { extractBusinessContext } from '../middleware';

export async function GET(request: NextRequest) {
  try {
    // Extract business context using middleware
    let businessId = await extractBusinessContext(request);
    
    // Create service client
    const supabase = createServiceClient();
    
    // Query for services
    let query = supabase.from('services').select('*');
    
    // If we have a business ID, use it to filter
    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    
    const { data: services, error } = await query;
    
    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
    
    // If no services found, return demo services
    if (!services || services.length === 0) {
      console.log('No services found, returning demo services');
      
      return NextResponse.json([
        {
          id: 'demo-service-1',
          name: 'Demo Service 1',
          description: 'This is a demo service for testing purposes.',
          price: 99.99,
          duration: 60,
          category: 'demo'
        },
        {
          id: 'demo-service-2',
          name: 'Demo Service 2',
          description: 'Another demo service for testing.',
          price: 149.99,
          duration: 90,
          category: 'demo'
        },
        {
          id: 'demo-service-3',
          name: 'Demo Service 3',
          description: 'A premium demo service.',
          price: 199.99,
          duration: 120,
          category: 'demo'
        }
      ]);
    }
    
    return NextResponse.json(services);
    
  } catch (error) {
    console.error('Error in list_business_services:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}

// Add POST method to handle requests from the AI assistant
export async function POST(request: NextRequest) {
  try {
    // Extract business context using middleware
    let businessId = await extractBusinessContext(request);
    
    // Create service client
    const supabase = createServiceClient();
    
    // Query for services
    let query = supabase.from('services').select('*');
    
    // If we have a business ID, use it to filter
    if (businessId) {
      query = query.eq('business_id', businessId);
    }
    
    const { data: services, error } = await query;
    
    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
    
    // If no services found, return demo services
    if (!services || services.length === 0) {
      console.log('No services found, returning demo services');
      
      return NextResponse.json([
        {
          id: 'demo-service-1',
          name: 'Demo Service 1',
          description: 'This is a demo service for testing purposes.',
          price: 99.99,
          duration: 60,
          category: 'demo'
        },
        {
          id: 'demo-service-2',
          name: 'Demo Service 2',
          description: 'Another demo service for testing.',
          price: 149.99,
          duration: 90,
          category: 'demo'
        },
        {
          id: 'demo-service-3',
          name: 'Demo Service 3',
          description: 'A premium demo service.',
          price: 199.99,
          duration: 120,
          category: 'demo'
        }
      ]);
    }
    
    return NextResponse.json(services);
    
  } catch (error) {
    console.error('Error in list_business_services (POST):', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 
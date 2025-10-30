import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { extractBusinessContext } from '../middleware';

export async function GET(request: NextRequest) {
  try {
    // Extract business context using middleware
    let businessId = await extractBusinessContext(request);
    
    // Create service client
    const supabase = createServiceClient();
    
    // If we have a business ID, fetch the business profile
    if (businessId) {
      const { data: business, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();
      
      if (error) {
        console.error('Error fetching business:', error);
        return NextResponse.json({ error: `Error fetching business: ${error}` }, { status: 500 });
      }
      
      if (business) {
        return NextResponse.json(business);
      }
    }
    
    // If no business found or no business ID, return demo business
    console.log('No business found, returning demo business');
    
    return NextResponse.json({
      id: 'demo-business',
      business_name: 'Demo Business',
      description: 'This is a demo business for testing purposes.',
      address: '123 Demo Street, Demo City, DC 12345',
      phone: '(555) 123-4567',
      email: 'contact@demobusiness.com',
      website: 'https://www.demobusiness.com',
      hours: {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      },
      timezone: 'America/New_York'
    });
    
  } catch (error) {
    console.error('Error in get_business_info:', error);
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
    
    // If we have a business ID, fetch the business profile
    if (businessId) {
      const { data: business, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();
      
      if (error) {
        console.error('Error fetching business:', error);
        return NextResponse.json({ error: `Error fetching business: ${error}` }, { status: 500 });
      }
      
      if (business) {
        return NextResponse.json(business);
      }
    }
    
    // If no business found or no business ID, return demo business
    console.log('No business found, returning demo business');
    
    return NextResponse.json({
      id: 'demo-business',
      business_name: 'Demo Business',
      description: 'This is a demo business for testing purposes.',
      address: '123 Demo Street, Demo City, DC 12345',
      phone: '(555) 123-4567',
      email: 'contact@demobusiness.com',
      website: 'https://www.demobusiness.com',
      hours: {
        monday: '9:00 AM - 5:00 PM',
        tuesday: '9:00 AM - 5:00 PM',
        wednesday: '9:00 AM - 5:00 PM',
        thursday: '9:00 AM - 5:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: 'Closed',
        sunday: 'Closed'
      },
      timezone: 'America/New_York'
    });
    
  } catch (error) {
    console.error('Error in get_business_info (POST):', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 
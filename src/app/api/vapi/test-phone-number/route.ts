import { NextRequest, NextResponse } from 'next/server';
import { VapiClient } from '@/lib/vapi-client';

// POST: Test creating a phone number with different formats
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const requestData = await request.json();
    
    // Get the Vapi API key from environment variables
    const vapiApiKey = process.env.VAPI_API_KEY || 'mock-api-key';
    
    // Create a Vapi client
    const vapiClient = new VapiClient({ token: vapiApiKey });
    
    // Try different formats for the phone number
    const testFormats = [
      // Format 1: phone as a string
      {
        provider: 'vapi',
        name: 'Test Phone 1',
        phone: 'US'
      },
      // Format 2: phone as an object with country
      {
        provider: 'vapi',
        name: 'Test Phone 2',
        phone: { country: 'US' }
      },
      // Format 3: no phone property
      {
        provider: 'vapi',
        name: 'Test Phone 3'
      },
      // Format 4: with assistantId
      {
        provider: 'vapi',
        name: 'Test Phone 4',
        phone: 'US',
        assistantId: requestData.assistant_id || ''
      }
    ];
    
    // Try each format and collect the results
    const results = [];
    
    for (const format of testFormats) {
      try {
        console.log(`Testing format: ${JSON.stringify(format)}`);
        const result = await vapiClient.phoneNumbers.create(format);
        results.push({
          format,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          format,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error testing phone number creation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: errorMessage 
    }, { status: 500 });
  }
} 
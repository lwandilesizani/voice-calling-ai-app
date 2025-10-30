import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Proxying request from incorrect path to correct path for update_booking');
    
    // Get the base URL with fallback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7ae14e7d-9684-4ad1-86c0-42a0a3abda47-00-1q4kt89zrpvu0.riker.replit.dev';
    
    // Extract all headers from the original request
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      headers.set(key, value);
    });
    
    // Forward the request to the correct endpoint
    const response = await fetch(`${baseUrl}/api/vapi/booking-tools/update_booking`, {
      method: 'POST',
      headers,
      body: request.body,
      duplex: 'half'
    } as RequestInit);
    
    if (!response.ok) {
      throw new Error(`Failed to proxy request: ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error in proxy route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
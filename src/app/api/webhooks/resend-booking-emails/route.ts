import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Resend } from 'resend';

// Create Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if provided
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== webhookSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Parse request body
    const body = await request.json();
    const { bookingId } = body;
    
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId parameter' }, { status: 400 });
    }
    
    // Create service client
    const supabase = createServiceClient();
    
    // Get the booking details with service and business information
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        business_id,
        service_id,
        customer_name,
        customer_email,
        customer_phone,
        booking_date,
        booking_time,
        notes,
        status,
        email_confirmed
      `)
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      return NextResponse.json({ error: `Booking not found: ${bookingError?.message}` }, { status: 404 });
    }
    
    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', booking.service_id)
      .single();
      
    if (serviceError) {
      return NextResponse.json({ error: `Service not found: ${serviceError.message}` }, { status: 404 });
    }
    
    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('business_profiles')
      .select('business_name, email')
      .eq('id', booking.business_id)
      .single();
    
    if (businessError) {
      console.error('Error retrieving business:', businessError);
      // Continue with the response even if business retrieval fails
    }
    
    // Format date for better readability
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Send emails
    let emailSent = false;
    let emailError = null;
    
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not set');
      }
      
      // Send email to customer
      const customerEmailResult = await resend.emails.send({
        from: `${process.env.RESEND_FROM_NAME || 'Booking System'} <${process.env.RESEND_FROM_EMAIL || 'bookings@wecallsmart.com'}>`,
        to: [booking.customer_email],
        subject: `Booking Confirmation - ${business?.business_name || 'Service Provider'}`,
        html: `
          <h1>Booking Confirmation</h1>
          <p>Dear ${booking.customer_name},</p>
          <p>Thank you for your booking with ${business?.business_name || 'our service provider'}.</p>
          <h2>Booking Details:</h2>
          <ul>
            <li><strong>Service:</strong> ${service.name}</li>
            <li><strong>Price:</strong> $${service.price}</li>
            <li><strong>Date:</strong> ${formattedDate}</li>
            <li><strong>Time:</strong> ${booking.booking_time}</li>
            <li><strong>Duration:</strong> ${service.duration} minutes</li>
            ${booking.notes ? `<li><strong>Notes:</strong> ${booking.notes}</li>` : ''}
          </ul>
          <p>If you need to make any changes to your booking, please contact us directly.</p>
          <p>Thank you for your booking!</p>
        `
      });
      
      console.log('Customer email sent successfully:', customerEmailResult);
      
      // Send notification to business owner if email is available
      if (business?.email) {
        const businessEmailResult = await resend.emails.send({
          from: `${process.env.RESEND_FROM_NAME || 'Booking System'} <${process.env.RESEND_FROM_EMAIL || 'bookings@wecallsmart.com'}>`,
          to: [business.email],
          subject: `New Booking - ${booking.customer_name}`,
          html: `
            <h1>New Booking</h1>
            <p>You have received a new booking.</p>
            <h2>Customer Details:</h2>
            <ul>
              <li><strong>Name:</strong> ${booking.customer_name}</li>
              <li><strong>Email:</strong> ${booking.customer_email}</li>
              <li><strong>Phone:</strong> ${booking.customer_phone}</li>
            </ul>
            <h2>Booking Details:</h2>
            <ul>
              <li><strong>Service:</strong> ${service.name}</li>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Time:</strong> ${booking.booking_time}</li>
              ${booking.notes ? `<li><strong>Notes/Special Requests:</strong> ${booking.notes}</li>` : ''}
            </ul>
            <p>You can manage this booking from your dashboard.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/bookings/${booking.id}">View Booking Details</a></p>
          `
        });
        
        console.log('Business email sent successfully:', businessEmailResult);
      } else {
        console.warn('No business email found, skipping business notification');
      }
      
      emailSent = true;
      
      // Update email_confirmed status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ email_confirmed: true })
        .eq('id', booking.id);
        
      if (updateError) {
        console.error('Error updating email_confirmed status:', updateError);
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      emailError = error;
    }
    
    return NextResponse.json({
      success: emailSent,
      booking_id: booking.id,
      email_sent: emailSent,
      email_error: emailError ? String(emailError) : null
    });
    
  } catch (error) {
    console.error('Error in resend-booking-emails webhook:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}

// Also support GET requests for easier testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const bookingId = url.searchParams.get('bookingId');
  
  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId parameter' }, { status: 400 });
  }
  
  // Create a POST request with the bookingId
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ bookingId })
  });
  
  return POST(mockRequest);
} 
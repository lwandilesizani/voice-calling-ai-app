import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Resend } from 'resend';

// Create Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// This endpoint can be called by a cron job to retry sending emails for bookings
// that haven't been confirmed yet
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    // Create service client
    const supabase = createServiceClient();
    
    // Get all bookings that haven't had emails confirmed
    // Limit to bookings created in the last 7 days to avoid processing very old bookings
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: bookings, error: bookingsError } = await supabase
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
        created_at
      `)
      .eq('email_confirmed', false)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50); // Process in batches to avoid timeouts
    
    if (bookingsError) {
      return NextResponse.json({ error: `Error fetching bookings: ${bookingsError.message}` }, { status: 500 });
    }
    
    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ message: 'No unconfirmed bookings found' });
    }
    
    console.log(`Found ${bookings.length} unconfirmed bookings to process`);
    
    // Process each booking
    const results = [];
    
    for (const booking of bookings) {
      try {
        // Get service details
        const { data: service, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .eq('id', booking.service_id)
          .single();
          
        if (serviceError) {
          results.push({
            booking_id: booking.id,
            success: false,
            error: `Service not found: ${serviceError.message}`
          });
          continue;
        }
        
        // Get business details
        const { data: business, error: businessError } = await supabase
          .from('business_profiles')
          .select('business_name, email')
          .eq('id', booking.business_id)
          .single();
        
        if (businessError) {
          console.error(`Error retrieving business for booking ${booking.id}:`, businessError);
          // Continue processing even if business retrieval fails
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
          
          console.log(`Customer email sent successfully for booking ${booking.id}:`, customerEmailResult);
          
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
            
            console.log(`Business email sent successfully for booking ${booking.id}:`, businessEmailResult);
          } else {
            console.warn(`No business email found for booking ${booking.id}, skipping business notification`);
          }
          
          emailSent = true;
          
          // Update email_confirmed status
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ email_confirmed: true })
            .eq('id', booking.id);
            
          if (updateError) {
            console.error(`Error updating email_confirmed status for booking ${booking.id}:`, updateError);
          }
        } catch (error) {
          console.error(`Error sending emails for booking ${booking.id}:`, error);
          emailError = error;
        }
        
        results.push({
          booking_id: booking.id,
          success: emailSent,
          error: emailError ? String(emailError) : null
        });
      } catch (bookingError) {
        console.error(`Error processing booking ${booking.id}:`, bookingError);
        results.push({
          booking_id: booking.id,
          success: false,
          error: String(bookingError)
        });
      }
    }
    
    return NextResponse.json({
      processed: bookings.length,
      results
    });
    
  } catch (error) {
    console.error('Error in retry-booking-emails cron:', error);
    return NextResponse.json({ 
      error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 
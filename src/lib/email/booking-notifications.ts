import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types';

// Create Resend client with error handling
let resend: Resend;
try {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set. Email functionality will not work.');
  }
  resend = new Resend(process.env.RESEND_API_KEY);
} catch (error) {
  console.error('Failed to initialize Resend client:', error);
  // Create a dummy client that logs errors instead of crashing
  resend = {
    emails: {
      send: async () => {
        console.error('Email sending attempted but Resend client is not properly initialized');
        throw new Error('Resend client not initialized');
      }
    }
  } as unknown as Resend;
}

/**
 * Sends booking notification emails when a new booking is created
 * Emails are sent to both the customer and business owner
 */
export async function sendNewBookingNotifications(bookingId: string): Promise<boolean> {
  try {
    // Try to create Supabase client for server-side operations
    let supabase;
    try {
      // First try with route handler client (requires cookies)
      supabase = await createRouteHandlerClient();
    } catch (error) {
      console.log('Failed to create route handler client, falling back to service client:', error);
      // Fall back to service client if route handler client fails (no cookies available)
      supabase = createServiceClient();
    }
    
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
        services!inner (
          id,
          name,
          price,
          duration,
          category
        )
      `)
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      console.error('Error retrieving booking:', bookingError);
      return false;
    }

    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('business_profiles')
      .select('business_name, email')
      .eq('id', booking.business_id)
      .single();
    
    if (businessError) {
      console.error('Error retrieving business:', businessError);
      return false;
    }

    // Extract service details
    const service = booking.services as any;
    
    // Format date and time for better readability
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Verify we have the required email addresses
    if (!booking.customer_email) {
      console.error('Cannot send customer email: customer_email is missing');
      return false;
    }
    
    // Verify Resend API key is set
    if (!process.env.RESEND_API_KEY) {
      console.error('Cannot send emails: RESEND_API_KEY is not set');
      return false;
    }
    
    // Send email to customer
    try {
      const customerEmailResult = await resend.emails.send({
        from: `${process.env.RESEND_FROM_NAME || 'Booking System'} <${process.env.RESEND_FROM_EMAIL || 'bookings@wecallsmart.com'}>`,
        to: [booking.customer_email],
        subject: `Booking Request Received - ${business?.business_name || 'Service Provider'}`,
        html: `
          <h1>Booking Request Received</h1>
          <p>Dear ${booking.customer_name},</p>
          <p>Thank you for your booking request with ${business?.business_name || 'our service provider'}.</p>
          <p>Your booking is currently <strong>pending confirmation</strong>. You will receive another email once your booking has been confirmed.</p>
          <h2>Booking Details:</h2>
          <ul>
            <li><strong>Service:</strong> ${service?.name || 'Requested service'}</li>
            <li><strong>Price:</strong> $${service?.price || '0.00'}</li>
            <li><strong>Date:</strong> ${formattedDate}</li>
            <li><strong>Time:</strong> ${booking.booking_time}</li>
            <li><strong>Duration:</strong> ${service?.duration || '0'} minutes</li>
            ${booking.notes ? `<li><strong>Notes:</strong> ${booking.notes}</li>` : ''}
          </ul>
          <p>If you need to make any changes to your booking, please contact ${business?.business_name || 'the service provider'} directly.</p>
          <p>Thank you for your booking!</p>
        `
      });
      console.log('Customer email sent successfully:', customerEmailResult);
    } catch (error) {
      console.error('Error sending customer email:', error);
      // Continue to try sending the business email even if customer email fails
    }
    
    // Send notification to business owner
    if (business?.email) {
      try {
        const businessEmailResult = await resend.emails.send({
          from: `${process.env.RESEND_FROM_NAME || 'Booking System'} <${process.env.RESEND_FROM_EMAIL || 'bookings@wecallsmart.com'}>`,
          to: [business.email],
          subject: `New Booking Request - ${booking.customer_name}`,
          html: `
            <h1>New Booking Request</h1>
            <p>You have received a new booking request that requires your confirmation.</p>
            <h2>Customer Details:</h2>
            <ul>
              <li><strong>Name:</strong> ${booking.customer_name}</li>
              <li><strong>Email:</strong> ${booking.customer_email}</li>
              <li><strong>Phone:</strong> ${booking.customer_phone}</li>
            </ul>
            <h2>Booking Details:</h2>
            <ul>
              <li><strong>Service:</strong> ${service?.name || 'Requested service'}</li>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Time:</strong> ${booking.booking_time}</li>
              ${booking.notes ? `<li><strong>Notes/Special Requests:</strong> ${booking.notes}</li>` : ''}
            </ul>
            <p>Please log in to your dashboard to confirm or reject this booking request.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/bookings/${booking.id}">View Booking Details</a></p>
          `
        });
        console.log('Business email sent successfully:', businessEmailResult);
      } catch (error) {
        console.error('Error sending business email:', error);
        // Continue even if business email fails
      }
    } else {
      console.warn('No business email found, skipping business notification');
    }

    return true;
  } catch (error) {
    console.error('Error sending new booking notification emails:', error);
    return false;
  }
}

/**
 * Sends booking confirmation emails to both the customer and business owner
 * and updates the email_confirmed status in the database
 */
export async function sendBookingConfirmationEmails(bookingId: string): Promise<boolean> {
  try {
    // Try to create Supabase client for server-side operations
    let supabase;
    try {
      // First try with route handler client (requires cookies)
      supabase = await createRouteHandlerClient();
    } catch (error) {
      console.log('Failed to create route handler client, falling back to service client:', error);
      // Fall back to service client if route handler client fails (no cookies available)
      supabase = createServiceClient();
    }
    
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
        services!inner (
          id,
          name,
          price,
          duration,
          category
        )
      `)
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      console.error('Error retrieving booking:', bookingError);
      return false;
    }

    // Get business details
    const { data: business, error: businessError } = await supabase
      .from('business_profiles')
      .select('business_name, email')
      .eq('id', booking.business_id)
      .single();
    
    if (businessError) {
      console.error('Error retrieving business:', businessError);
      return false;
    }

    // Extract service details
    const service = booking.services as any;
    
    // Verify we have the required email addresses
    if (!booking.customer_email) {
      console.error('Cannot send customer email: customer_email is missing');
      return false;
    }
    
    // Verify Resend API key is set
    if (!process.env.RESEND_API_KEY) {
      console.error('Cannot send emails: RESEND_API_KEY is not set');
      return false;
    }
    
    // Determine email subject and content based on booking status
    const statusText = booking.status === 'cancelled' ? 'Cancelled' : 'Confirmation';
    const statusMessage = booking.status === 'cancelled' 
      ? `Your booking with ${business?.business_name || 'your service provider'} has been cancelled.`
      : `Your booking with ${business?.business_name || 'your service provider'} has been confirmed.`;
    const additionalMessage = booking.status === 'cancelled'
      ? '<p>If you would like to reschedule, please make a new booking.</p>'
      : '<p>We look forward to seeing you!</p>';
    
    // Format date for better readability
    const formattedDate = new Date(booking.booking_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Send email to customer
    try {
      const customerEmailResult = await resend.emails.send({
        from: `${business?.business_name || 'Booking System'} <${process.env.RESEND_FROM_EMAIL || 'bookings@wecallsmart.com'}>`,
        to: [booking.customer_email],
        subject: `Booking ${statusText} - ${business?.business_name || 'Your Service Provider'}`,
        html: `
          <h1>Booking ${statusText}</h1>
          <p>Dear ${booking.customer_name},</p>
          <p>${statusMessage}</p>
          <h2>Booking Details:</h2>
          <ul>
            <li><strong>Service:</strong> ${service?.name || 'Requested service'}</li>
            <li><strong>Price:</strong> $${service?.price || '0.00'}</li>
            <li><strong>Date:</strong> ${formattedDate}</li>
            <li><strong>Time:</strong> ${booking.booking_time}</li>
            <li><strong>Duration:</strong> ${service?.duration || '0'} minutes</li>
            ${booking.notes ? `<li><strong>Notes:</strong> ${booking.notes}</li>` : ''}
          </ul>
          ${additionalMessage}
          <p>If you need to cancel or reschedule, please contact us at ${business?.email || 'our support team'}.</p>
          <p>Thank you for your booking!</p>
        `
      });
      console.log('Customer confirmation email sent successfully:', customerEmailResult);
    } catch (error) {
      console.error('Error sending customer confirmation email:', error);
      // Continue to try sending the business email even if customer email fails
    }
    
    // Send notification to business owner
    if (business?.email) {
      try {
        const businessEmailResult = await resend.emails.send({
          from: `Booking System <${process.env.RESEND_FROM_EMAIL || 'bookings@wecallsmart.com'}>`,
          to: [business.email],
          subject: `New Booking - ${booking.customer_name}`,
          html: `
            <h1>New Booking Received</h1>
            <p>A new booking has been made:</p>
            <h2>Customer Details:</h2>
            <ul>
              <li><strong>Name:</strong> ${booking.customer_name}</li>
              <li><strong>Email:</strong> ${booking.customer_email}</li>
              <li><strong>Phone:</strong> ${booking.customer_phone}</li>
            </ul>
            <h2>Booking Details:</h2>
            <ul>
              <li><strong>Service:</strong> ${service?.name || 'Requested service'}</li>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Time:</strong> ${booking.booking_time}</li>
              ${booking.notes ? `<li><strong>Notes/Special Requests:</strong> ${booking.notes}</li>` : ''}
            </ul>
            <p>You can manage this booking from your dashboard.</p>
          `
        });
        console.log('Business confirmation email sent successfully:', businessEmailResult);
      } catch (error) {
        console.error('Error sending business confirmation email:', error);
        // Continue even if business email fails
      }
    } else {
      console.warn('No business email found, skipping business confirmation notification');
    }

    // Update the email_confirmed status in the database
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ email_confirmed: true })
      .eq('id', bookingId);
    
    if (updateError) {
      console.error('Error updating email_confirmed status:', updateError);
      // Continue even if update fails
    }

    return true;
  } catch (error) {
    console.error('Error sending booking confirmation emails:', error);
    return false;
  }
} 
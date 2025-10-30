'use server';

import { sendBookingConfirmationEmails, sendNewBookingNotifications } from '@/lib/email/booking-notifications';

/**
 * Server action to send booking confirmation emails
 */
export async function sendBookingConfirmationAction(bookingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendBookingConfirmationEmails(bookingId);
    return { success: result };
  } catch (error) {
    console.error('Error in sendBookingConfirmationAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Server action to send new booking notification emails
 * This should be called when a new booking is created
 */
export async function sendNewBookingNotificationAction(bookingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await sendNewBookingNotifications(bookingId);
    return { success: result };
  } catch (error) {
    console.error('Error in sendNewBookingNotificationAction:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
} 
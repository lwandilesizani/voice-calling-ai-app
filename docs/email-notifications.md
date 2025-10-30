# Email Notification System for Bookings

This document outlines how the email notification system works for bookings in our application.

## Overview

The booking system automatically sends email notifications to both customers and business owners when:

1. A new booking is created
2. A booking status is changed (confirmed or cancelled)

This ensures that all parties are kept informed about booking activities without requiring manual intervention.

## Email Types

### 1. New Booking Notifications

When a new booking is created:

- **Customer Email**: Confirms that their booking request has been received
- **Business Owner Email**: Notifies them of a new booking that requires their attention

These emails are sent automatically when a booking is created through:
- The AI assistant booking tool
- The booking form on the website
- The API endpoint

### 2. Booking Status Change Notifications

When a booking status is changed to "confirmed" or "cancelled":

- **Customer Email**: Informs them of the status change
- **Business Owner Email**: Confirms the action they've taken

These emails are sent automatically when:
- A business owner changes a booking status in the dashboard
- The status is changed through the API

## Implementation Details

### Automatic Email Sending

Emails are sent automatically in the following scenarios:

1. **New Booking Creation**:
   ```typescript
   // In book_business_service/route.ts
   // After creating the booking
   await sendNewBookingNotifications(booking.id);
   ```

2. **Booking Status Changes**:
   ```typescript
   // In bookings/page.tsx
   // When status changes to confirmed or cancelled
   if (newStatus === 'confirmed' || newStatus === 'cancelled') {
     await sendBookingConfirmationAction(bookingId);
   }
   ```

### Email Confirmation Status

The system tracks whether emails have been sent using the `email_confirmed` field in the `bookings` table:

- `email_confirmed: true` - Emails have been sent successfully
- `email_confirmed: false` - Emails are pending or failed to send

### Manual Resend Option

If emails fail to send automatically, business owners can manually resend them from the bookings dashboard by clicking the email icon next to a booking with "Email Pending" status.

## Email Templates

### New Booking Template (Customer)

```html
<h1>Booking Request Received</h1>
<p>Dear [Customer Name],</p>
<p>Thank you for your booking request with [Business Name].</p>
<p>Your booking is currently <strong>pending confirmation</strong>. You will receive another email once your booking has been confirmed.</p>
<h2>Booking Details:</h2>
<ul>
  <li><strong>Service:</strong> [Service Name]</li>
  <li><strong>Price:</strong> $[Price]</li>
  <li><strong>Date:</strong> [Formatted Date]</li>
  <li><strong>Time:</strong> [Booking Time]</li>
  <li><strong>Duration:</strong> [Duration] minutes</li>
  <li><strong>Notes:</strong> [Notes]</li>
</ul>
```

### Booking Confirmation Template (Customer)

```html
<h1>Booking [Status]</h1>
<p>Dear [Customer Name],</p>
<p>Your booking with [Business Name] has been [confirmed/cancelled].</p>
<h2>Booking Details:</h2>
<ul>
  <li><strong>Service:</strong> [Service Name]</li>
  <li><strong>Price:</strong> $[Price]</li>
  <li><strong>Date:</strong> [Formatted Date]</li>
  <li><strong>Time:</strong> [Booking Time]</li>
  <li><strong>Duration:</strong> [Duration] minutes</li>
  <li><strong>Notes:</strong> [Notes]</li>
</ul>
```

## Troubleshooting

If emails are not being sent:

1. Check that the `RESEND_API_KEY` environment variable is set correctly
2. Verify that the `RESEND_FROM_EMAIL` and `RESEND_FROM_NAME` environment variables are configured
3. Check the server logs for any errors related to email sending
4. Ensure the business profile has a valid email address

## Future Improvements

1. Add email templates customization for businesses
2. Implement email tracking (opens, clicks)
3. Add reminder emails for upcoming bookings
4. Allow customers to cancel or reschedule through email links 
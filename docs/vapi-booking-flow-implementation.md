# Vapi Booking Flow Implementation Guide

This guide provides step-by-step instructions for implementing the improved booking flow for the Vapi AI assistant.

## Overview

We've made the following changes to improve the booking flow:

1. **Fixed Email Notifications**: Emails are now sent reliably when bookings are processed by the Vapi AI assistant
2. **Added New Tools**: Created tools to retrieve and update bookings
3. **Updated System Prompt**: Added specific instructions for the booking flow

## Implementation Steps

### 1. Deploy the API Endpoints

The following API endpoints have been created:

- `/api/vapi/booking-tools/get_customer_bookings`: Retrieves existing bookings for a customer
- `/api/vapi/booking-tools/update_booking`: Updates an existing booking

These endpoints are already deployed as part of the codebase.

### 2. Publish the New Tools

Run the following command to publish the new tools to Vapi:

```bash
# Set your Vapi API key
export VAPI_API_KEY=your_vapi_api_key

# Run the publish tools script
node vapi/publish-tools.js
```

If you encounter any issues, you can also update the existing tools and assistant:

```bash
node vapi/publish-vapi-config.js update
```

### 3. Update the System Prompt

The system prompt has been updated in the codebase to include the booking flow instructions. When you activate a new AI assistant or edit an existing one, the updated system prompt will be used.

To activate or update an AI assistant:

1. Go to the "My Assistants" page in the UI
2. Click "Activate AI Assistant" or edit an existing assistant
3. The updated system prompt will be used automatically

### 4. Test the New Booking Flow

Test the new booking flow to ensure it works as expected:

1. **Create a Booking**:
   - The AI should collect all required information
   - The AI should verify each piece of information
   - The AI should summarize and ask for confirmation
   - The AI should create the booking only after confirmation
   - Both the customer and business owner should receive email notifications

2. **Update a Booking**:
   - The AI should retrieve the existing booking
   - The AI should update the booking instead of creating a new one
   - Both the customer and business owner should receive updated email notifications

## Troubleshooting

### Email Notifications Not Sent

If email notifications are not being sent:

1. Check the server logs for errors
2. Verify that the RESEND_API_KEY environment variable is set
3. Use the webhook endpoint to manually resend emails:
   ```
   GET /api/webhooks/resend-booking-emails?bookingId=<booking_id>
   ```

### Multiple Bookings Created

If multiple bookings are still being created:

1. Verify that the system prompt has been updated
2. Check that the new tools have been published successfully
3. Restart the AI assistant to ensure it's using the updated system prompt

### Tool Publishing Errors

If you encounter errors when publishing the tools:

1. Verify that the VAPI_API_KEY environment variable is set
2. Check that the tool definition files exist in the `vapi/tools` directory
3. Try running the publish-vapi-config.js script with the update command:
   ```
   node vapi/publish-vapi-config.js update
   ```

## Additional Resources

- [Booking Email Fix Documentation](./booking-email-fix.md): Details on the email notification fix
- [Vapi Booking Flow Fix Documentation](./vapi-booking-flow-fix.md): Details on the booking flow improvements 
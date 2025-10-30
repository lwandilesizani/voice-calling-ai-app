# Cal.com Integration Guide

This document provides instructions for setting up and testing the Cal.com integration for the AI Dialer application.

## Prerequisites

1. A Cal.com account (free or paid)
2. API access to Cal.com

## Setup Steps

### 1. Create/Configure Your Cal.com Account

1. Sign up or log in to your Cal.com account at https://cal.com
2. Ensure your username matches the `CALCOM_USERNAME` in your `.env.local` file (currently set to `lwandile-sizani-xyfaup`)

### 2. Create an Event Type

1. Go to "Event Types" in your Cal.com dashboard
2. Create a new event type with the following settings:
   - Name: 30 Min Meeting (or any name you prefer)
   - Slug: 30min (must match `CALCOM_EVENT_SLUG` in `.env.local`)
   - Duration: 30 minutes (must match `CALCOM_EVENT_DURATION` in `.env.local`)
   - Configure other settings as needed (location, description, etc.)

### 3. Get Your Event Type ID

1. After creating the event type, navigate to it in your Cal.com dashboard
2. The Event Type ID is in the URL: `https://app.cal.com/event-types/[EVENT_TYPE_ID]`
3. Update the `CALCOM_EVENT_TYPE_ID` in your `.env.local` file with this ID

### 4. Generate an API Key

1. Go to "Settings" > "Developer" > "API Keys" in your Cal.com dashboard
2. Create a new API key with appropriate permissions (read/write access)
3. Update the `CALCOM_API_KEY` in your `.env.local` file with this key

### 5. Update Environment Variables

Ensure your `.env.local` file has the following Cal.com-related variables:

```
CALCOM_API_KEY=your_api_key
CALCOM_EVENT_TYPE_ID=your_event_type_id
CALCOM_EVENT_DURATION=30
CALCOM_USERNAME=lwandile-sizani-xyfaup
CALCOM_EVENT_SLUG=30min
CALCOM_BOOKING_LINK=https://cal.com/lwandile-sizani-xyfaup/30min
```

## Testing the Integration

Run the following command to test your Cal.com integration:

```bash
npm run test:cal
```

This will:
1. Fetch available slots from your Cal.com calendar
2. Display the results in the console

If successful, you should see a list of available time slots. If there are errors, check your Cal.com configuration and API key.

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Ensure your API key is correct and has the necessary permissions
2. **Event Type Not Found**: Verify the Event Type ID is correct
3. **No Available Slots**: Check your Cal.com calendar for availability

### Debugging

For more detailed debugging, you can modify the test script at `src/scripts/test-cal-integration.ts` to include more logging or test additional functionality.

## Integration with VAPI

The Cal.com integration is used by the VAPI assistant to:
1. Check availability for appointments
2. Book appointments on behalf of leads

The integration is handled through the API endpoint at `/api/integrations/vapi/route.ts`. 
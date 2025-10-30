# Cal.com API Integration Guide

## Authentication Issue Fix

The error message `{"message":"No apiKey provided"}` occurs because Cal.com's v1 API requires the API key to be provided as a query parameter, not just in the Authorization header.

Additionally, the error `{"error":"Your API key is not valid."}` indicates that the API key being used is incorrect.

## Correct API Key

Your correct Cal.com API key is found in your `.env.local` file:
```
CALCOM_API_KEY=your_calcom_api_key_here
```

Make sure to use your actual API key from the `.env.local` file in all your API requests.

## Time Zone Configuration

Your Cal.com account is configured with the following availability:
- Working Hours: Monday - Friday, 9:00 AM - 5:00 PM
- Time Zone: Africa/Johannesburg (UTC+2)

When creating bookings, you must use this time zone and schedule bookings within your working hours to avoid the `no_available_users_found_error`.

## Correct Authentication Method

For Cal.com API v1, you need to:

1. Include your API key as a query parameter (`?apiKey=YOUR_API_KEY`)
2. Also include it in the Authorization header

## Required Fields

The Cal.com API requires specific fields for different endpoints:

### For Booking Creation:
- `timeZone`: Required (e.g., "Africa/Johannesburg")
- `language`: Required (e.g., "en")
- `metadata`: Required (can be an empty object `{}`)
- `responses`: Required - must include:
  - `email`: The email of the attendee
  - `name`: The name of the attendee
- For attendees, each attendee must have:
  - `timeZone`: Required
  - `language`: Required

## Example Usage

### 1. Get User Information

For user information, use the event-types endpoint instead of users/me:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://api.cal.com/v1/event-types?apiKey=YOUR_API_KEY"
```

### 2. Create a Booking

```bash
curl -X POST "https://api.cal.com/v1/bookings?apiKey=YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypeId": 950492,
    "start": "2025-12-15T10:00:00+02:00",
    "end": "2025-12-15T10:30:00+02:00",
    "timeZone": "Africa/Johannesburg",
    "language": "en",
    "metadata": {},
    "responses": {
      "email": "client@example.com",
      "name": "Client Name"
    },
    "attendees": [
      {
        "email": "client@example.com",
        "name": "Client Name",
        "timeZone": "Africa/Johannesburg",
        "language": "en"
      }
    ]
  }'
```

### 3. Check Available Slots

```bash
curl "https://api.cal.com/v1/slots?apiKey=YOUR_API_KEY" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -G \
  --data-urlencode "eventTypeId=950492" \
  --data-urlencode "startTime=2025-12-01T00:00:00+02:00" \
  --data-urlencode "endTime=2025-12-31T23:59:59+02:00" \
  --data-urlencode "timeZone=Africa/Johannesburg"
```

### 4. List Event Types

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://api.cal.com/v1/event-types?apiKey=YOUR_API_KEY"
```

## API Key Management

- Test mode secret keys have the prefix `cal_`
- Live mode secret keys have the prefix `cal_live_`
- Keep your API keys secure and never share them in public repositories

## Important Notes

1. All API requests must be made over HTTPS
2. API requests without proper authentication will fail
3. For v2 of the API, the authentication method is different (Bearer token in Authorization header only)
4. Make sure to include all required fields to avoid validation errors
5. Ensure bookings are within your configured working hours (Mon-Fri, 9:00 AM - 5:00 PM Africa/Johannesburg time)
6. The minimum booking notice for your event types is 120 minutes (2 hours)

## Reference

For more details, refer to the [Cal.com API documentation](https://cal.com/docs/api-reference/v1/authentication).

## Script Example

A shell script example is provided in this repository (`cal_api_example.sh`) that demonstrates the correct way to make API calls to Cal.com. 
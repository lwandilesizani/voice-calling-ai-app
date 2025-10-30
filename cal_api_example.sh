#!/bin/bash

# Set your API key from .env.local
API_KEY="cal_live_8555f473b3c35c12b2a5b7a63ab2ea6d"
EVENT_TYPE_ID="950492"

# Example 1: Get user information
echo "Getting user information..."
curl -s -H "Authorization: Bearer $API_KEY" \
     "https://api.cal.com/v1/event-types?apiKey=$API_KEY"

# Example 2: Create a booking
# Note: Using Africa/Johannesburg time zone (UTC+2) and within working hours (9:00 AM - 5:00 PM)
echo -e "\nCreating a booking..."
curl -s -X POST "https://api.cal.com/v1/bookings?apiKey=$API_KEY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypeId": '"$EVENT_TYPE_ID"',
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

# Example 3: List event types
echo -e "\nListing event types..."
curl -s -H "Authorization: Bearer $API_KEY" \
     "https://api.cal.com/v1/event-types?apiKey=$API_KEY"

# Note: The key is to include the API key as a query parameter (?apiKey=YOUR_API_KEY)
# while also including it in the Authorization header 
#!/bin/bash

# Set your API key from .env.local
API_KEY="cal_live_8555f473b3c35c12b2a5b7a63ab2ea6d"
EVENT_TYPE_ID="1950494"  # 15 Min Meeting

# Create a booking with all required fields
echo "Creating a 15-minute booking..."
curl -s -X POST "https://api.cal.com/v1/bookings?apiKey=$API_KEY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypeId": '"$EVENT_TYPE_ID"',
    "start": "2025-12-15T11:00:00+02:00",
    "end": "2025-12-15T11:15:00+02:00",
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
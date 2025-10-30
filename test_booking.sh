#!/bin/bash

# Set your API key from .env.local
API_KEY="cal_live_8555f473b3c35c12b2a5b7a63ab2ea6d"
EVENT_TYPE_ID="950492"

# Create a booking with all required fields
echo "Creating a booking..."
curl -v -X POST "https://api.cal.com/v1/bookings?apiKey=$API_KEY" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypeId": '"$EVENT_TYPE_ID"',
    "start": "2025-03-06T10:00:00Z",
    "end": "2025-03-06T10:30:00Z",
    "timeZone": "UTC",
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
        "timeZone": "UTC",
        "language": "en"
      }
    ]
  }' 
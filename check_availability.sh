#!/bin/bash

# Set your API key from .env.local
API_KEY="cal_live_8555f473b3c35c12b2a5b7a63ab2ea6d"
EVENT_TYPE_ID="950492"  # 30 Min Meeting

# Check available slots
echo "Checking available slots..."
curl -s "https://api.cal.com/v1/slots?apiKey=$API_KEY" \
  -H "Authorization: Bearer $API_KEY" \
  -G \
  --data-urlencode "eventTypeId=$EVENT_TYPE_ID" \
  --data-urlencode "startTime=2025-12-01T00:00:00+02:00" \
  --data-urlencode "endTime=2025-12-31T23:59:59+02:00" \
  --data-urlencode "timeZone=Africa/Johannesburg" 
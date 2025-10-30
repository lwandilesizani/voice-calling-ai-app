# Phone Number Provisioning Guide

This document explains how phone numbers are provisioned in our application and how to handle common issues like area code unavailability.

## Overview

Our application uses the Vapi API to provision phone numbers for businesses. Each business can have one phone number that is connected to an AI assistant. The phone number is used to receive calls from customers, which are then handled by the AI assistant.

## Provisioning Process

1. **Request a Phone Number**: Business owners can request a phone number from the Phone Numbers page in the dashboard.

2. **Specify Area Code (Optional)**: Business owners can optionally specify a desired area code for their phone number.

3. **Connect to Assistant**: The phone number can be connected to an AI assistant during creation or later.

4. **Automatic Provisioning**: The system automatically provisions a phone number through the Vapi API.

## Error Handling Policy

Our system follows a strict error handling policy for phone number provisioning:

1. **No Mock Numbers**: We never create mock or dummy phone numbers. If the Vapi API call fails for any reason, no phone number is created in our system.

2. **Clear Error Messages**: When an error occurs, we provide clear error messages to the user explaining what went wrong.

3. **Suggested Alternatives**: For area code unavailability errors, we provide suggested alternative area codes that are likely to be available.

4. **Rollback on Partial Failures**: If a phone number is created in Vapi but fails to save in our database, we attempt to delete the number from Vapi to maintain consistency.

## Handling Area Code Unavailability

Sometimes, the requested area code may not be available. This can happen for several reasons:

- The area code is not supported by the provider
- All numbers with that area code are currently taken
- Regulatory restrictions for that area code

When this happens, our system:

1. Displays an error message explaining that the area code is unavailable
2. Provides a list of suggested alternative area codes
3. Allows the user to select one of the suggested area codes
4. Alternatively, the user can leave the area code field blank to get any available number

### User Experience

When an area code is unavailable:

1. The user sees an error message: "This area code is currently not available."
2. Below the error, a section titled "Suggested Available Area Codes" appears
3. The user can click on any of the suggested area codes to try again
4. The system automatically attempts to provision a number with the selected area code
5. The user can also choose to leave the area code field blank to get any available number

## Common Area Codes

Here are some common area codes that are typically available:

- **212, 646, 917**: New York City
- **213, 310**: Los Angeles
- **312**: Chicago
- **415**: San Francisco
- **202**: Washington DC
- **305**: Miami
- **214**: Dallas
- **713**: Houston
- **404**: Atlanta
- **617**: Boston

## Troubleshooting

If you encounter issues with phone number provisioning:

1. **No Area Codes Available**: If no suggested area codes are shown, try leaving the area code field blank to get any available number.

2. **All Attempts Fail**: If all attempts to provision a number fail, contact support at support@wecallsmart.com.

3. **Need a Specific Area Code**: If you need a specific area code that's not available, contact admin@wecallsmart.com to discuss options.

4. **Multiple Phone Numbers**: By default, each business is limited to one phone number. To request additional phone numbers, contact admin@wecallsmart.com.

## Technical Implementation

For developers, the phone number provisioning process is implemented as follows:

1. The frontend sends a request to `/api/vapi/phone-numbers` with the desired parameters
2. The API calls the Vapi API to provision a number
3. If successful, the phone number is saved in our database
4. If the area code is unavailable, the API returns a structured error with suggested alternatives
5. If any other error occurs, a clear error message is returned
6. The frontend displays the error and suggestions to the user

### Error Response Format

```json
{
  "error": "Area code unavailable",
  "message": "This area code is currently not available.",
  "suggestedAreaCodes": ["212", "646", "917", "415", "312"]
}
```

### Error Handling Flow

1. **Frontend Validation**: Basic validation is performed in the frontend before sending the request
2. **API Call**: The request is sent to our API, which forwards it to Vapi
3. **Error Detection**: If Vapi returns an error, our API detects the error type
4. **Structured Response**: Our API returns a structured error response with helpful information
5. **UI Feedback**: The frontend displays the error and any suggested alternatives
6. **User Action**: The user can select a suggested area code or make other changes
7. **Retry**: The user can retry with the new information

## Future Improvements

Planned improvements to the phone number provisioning process:

1. **Area Code Search**: Allow users to search for area codes by location
2. **Number Selection**: Allow users to select from available numbers rather than just area codes
3. **Number Porting**: Support for porting existing phone numbers
4. **International Numbers**: Support for international phone numbers 
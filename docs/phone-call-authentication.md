# Phone Call Authentication for AI Assistant

## Overview

This document explains how the AI assistant authenticates and identifies the correct business context when accessed through phone calls instead of the UI.

## Problem Statement

When users access the AI assistant through the UI, they are authenticated through their session, which provides the business context. However, when the AI assistant is accessed through phone calls, there is no user session, making it challenging to identify which business's data to access.

## Solution

We've implemented a multi-layered approach to identify the business context for phone calls:

1. **Phone Number Mapping**: Each phone number is associated with a business in the `phone_numbers` table
2. **Assistant Mapping**: Each assistant is associated with a business in the `assistants` table
3. **Context Extraction**: The system extracts business context from incoming calls
4. **Middleware**: A middleware layer handles business identification for all tool calls

## Implementation Details

### Database Tables

- `phone_numbers`: Maps phone numbers to businesses via `business_id`
- `assistants`: Maps assistants to businesses via `business_profile_id`

### Business Identification Process

1. When a call comes in, the system extracts:
   - The phone number being called (`call.to`)
   - The assistant ID handling the call (`assistant.id`)

2. The system then tries to identify the business in this order:
   - Look up the business by phone number in the `phone_numbers` table
   - Look up the business by assistant ID in the `phone_numbers` table
   - Look up the business by assistant ID in the `assistants` table
   - If all else fails, use a fallback mechanism

3. Once identified, the business ID is stored in a context object that is passed to all tool handlers

### API Routes

The following API routes have been updated to handle business context extraction:

- `/api/vapi/booking-tools/get_business_info`
- `/api/vapi/booking-tools/list_business_services`
- `/api/vapi/booking-tools/book_business_service`
- `/api/vapi/booking-tools/get_business_availability`

### Middleware

A middleware function `extractBusinessContext` handles business identification for all tool calls:

```typescript
export async function extractBusinessContext(request: NextRequest) {
  // Extract business context from headers
  const contextHeader = request.headers.get('X-Business-Context');
  
  // If no business ID in context, try to extract from phone number or assistant ID
  // ...
  
  return businessId;
}
```

## Headers

The following headers are used to pass context between services:

- `X-Business-Context`: JSON string containing the business ID
- `X-Phone-Number`: The phone number being called
- `X-Assistant-ID`: The assistant ID handling the call

## Fallback Mechanism

If the system cannot identify the business, it falls back to:

1. Using the business ID associated with the service being accessed
2. If that fails, using the first business in the database

## Security Considerations

- The Vapi integration API is secured with an API key (`x-vapi-secret`)
- All database access uses the service role client, which has access to all data
- Business verification ensures services belong to the identified business

## Testing

To test the phone call authentication:

1. Create a phone number in the system and associate it with a business
2. Create an assistant and associate it with the same business
3. Make a test call to the phone number
4. Verify that the correct business context is identified

## Future Improvements

1. Add more robust error handling for business identification failures
2. Implement caching for frequently accessed business contexts
3. Add logging for business identification events
4. Enhance security with additional verification mechanisms 
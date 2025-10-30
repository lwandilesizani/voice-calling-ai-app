# Vapi Booking Tools API

This API provides tools for booking services with a business through Vapi.

## Tools

### 1. Get Business Info
- **Endpoint**: `/get_business_info`
- **Method**: GET
- **Description**: Gets information about the logged-in business owner
- **Response**: Business profile information

### 2. List Business Services
- **Endpoint**: `/list_business_services`
- **Method**: GET
- **Description**: Lists all services offered by the logged-in business
- **Response**: Array of service objects

### 3. Book Business Service
- **Endpoint**: `/book_business_service`
- **Method**: POST
- **Description**: Books a service appointment with the business
- **Request Body**:
  ```json
  {
    "service_id": "uuid",
    "customer_name": "string",
    "customer_email": "string",
    "customer_phone": "string",
    "booking_date": "YYYY-MM-DD",
    "booking_time": "HH:MM",
    "notes": "string (optional)"
  }
  ```
- **Response**: Booking confirmation

## Implementation

The API is implemented using Express.js and connects to a Supabase database. It uses Zod for request validation.

## Authentication

The API expects an authorization header with a token that identifies the business. In the current implementation, it uses a simplified approach that gets the first business in the database.

## Deployment

1. Install dependencies:
   ```
   npm install
   ```

2. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

3. Integrate with your Express.js application:
   ```javascript
   const bookingToolsRouter = require('./api');
   app.use('/api/integrations/vapi', bookingToolsRouter);
   ```

4. Update the Vapi configuration:
   ```
   cd vapi
   node publish-vapi-config.js create
   ``` 
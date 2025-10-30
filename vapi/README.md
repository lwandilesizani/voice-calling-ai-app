# Vapi AI Assistant Configuration

This directory contains the configuration files for the Vapi AI assistant used in the AI Dialer application.

## Tools

The assistant uses the following tools:

### 1. get_business_info
- **Description**: Gets information about the logged-in business owner
- **ID**: 13d5268b-ee17-4e8d-b40b-0ac9fcde8a07
- **Parameters**: None required

### 2. list_business_services
- **Description**: Lists all services offered by the logged-in business owner
- **ID**: 38262930-229d-4b99-9ef4-005db9022579
- **Parameters**: None required

### 3. book_business_service
- **Description**: Books a service appointment with the business owner
- **ID**: 10051471-0585-45f6-aead-79e33dfdc954
- **Required Parameters**:
  - `service_id`: ID of the service to book
  - `customer_name`: Full name of the customer
  - `customer_email`: Email address of the customer
  - `customer_phone`: Contact phone number of the customer
  - `booking_date`: Date for the booking in YYYY-MM-DD format
  - `booking_time`: Time for the booking in HH:MM format (24-hour)
- **Optional Parameters**:
  - `notes`: Any additional notes or special requests for the booking

### 4. get_business_availability
- **Description**: Gets the available time slots for a specific service or date range
- **ID**: eaa16c5a-65a2-4442-90ec-3324b172dacc
- **Required Parameters**:
  - `service_id`: ID of the service to check availability for
  - `start_date`: Start date for availability check in YYYY-MM-DD format
  - `timezone`: The timezone to return available slots in (e.g., 'America/Los_Angeles')
- **Optional Parameters**:
  - `end_date`: End date for availability check in YYYY-MM-DD format

## Assistant

- **Name**: [ai-dialer] HVAC Sales Agent
- **ID**: 077b012d-8fb8-43bd-889f-cfda7900e1e4
- **Model**: gpt-4o
- **Voice**: JBFqnCBsd6RMkjVDRZzb (11labs)

## Publishing Configuration

To publish or update the Vapi configuration, use the following command:

```bash
# Create new tools and assistant
node publish-vapi-config.js create

# Update existing tools and assistant
node publish-vapi-config.js update
```

## Demo Booking Process

The assistant follows this process for booking demos or service appointments:

1. Use `list_business_services` to get available services
2. Use `get_business_availability` to check available time slots
3. Present available dates and times to the customer
4. Once the customer selects a time, use `book_business_service` to book the appointment 
# AI Assistant Documentation

## Overview

The AI Assistant feature provides businesses with a virtual assistant that can interact with customers, provide information about the business and its services, and help with booking appointments. The assistant is powered by OpenAI's GPT models and uses Vapi.ai for voice capabilities.

## Key Features

- **Business-Specific Context**: The assistant uses real business data from the database to provide accurate information
- **Service Information**: Can list and describe services offered by the business
- **Availability Checking**: Can check real-time availability for services
- **Booking**: Can create bookings for customers
- **Voice Interaction**: Supports voice-based conversations

## Implementation Details

### System Architecture

The AI Assistant consists of several components:

1. **Assistant Configuration**: Stored in the `assistant_configs` table
2. **Assistant Tools**: Functions that allow the assistant to interact with business data
3. **Prompt Templates**: Templates for system prompts and first messages
4. **Vapi Integration**: Integration with Vapi.ai for voice capabilities

### Database Tables

- `assistant_configs`: Stores configuration for each business's assistant
- `assistants`: Stores information about created assistants
- `assistant_tools`: Stores tools available to assistants
- `business_profiles`: Contains business information
- `services`: Contains service information
- `service_availability`: Contains availability information
- `bookings`: Contains booking information

### Tools

The assistant has access to the following tools:

1. **get_business_info**: Retrieves information about the business
   - Returns: Business name, address, contact information, business hours

2. **list_business_services**: Lists all services offered by the business
   - Returns: Service IDs, names, descriptions, prices, durations

3. **get_business_availability**: Checks availability for a specific service
   - Parameters: 
     - `service_id`: ID of the service
     - `start_date`: Start date for availability check
     - `end_date`: (Optional) End date for availability check
     - `timezone`: Timezone for availability
   - Returns: Available dates and time slots

4. **book_business_service**: Books a service appointment
   - Parameters:
     - `service_id`: ID of the service to book
     - `customer_name`: Name of the customer
     - `customer_email`: Email of the customer
     - `customer_phone`: Phone number of the customer
     - `booking_date`: Date for the booking
     - `booking_time`: Time for the booking
     - `notes`: (Optional) Additional notes
   - Returns: Booking confirmation

### Prompt Templates

The assistant uses template-based prompts that are customized for each business:

1. **System Prompt**: Defines the assistant's behavior and capabilities
   - Template: `vapi/prompts/business-system-prompt.md`
   - Placeholders: `{{business_name}}`

2. **First Message**: The initial message the assistant says to customers
   - Template: `vapi/prompts/business-first-message.txt`
   - Placeholders: `{{business_name}}`

### Context-Aware Responses

The assistant is designed to always use real business data rather than making assumptions:

1. When asked about the business, it uses `get_business_info` to fetch accurate details
2. When asked about services, it uses `list_business_services` to get the current service list
3. When asked about availability, it uses `get_business_availability` to check real-time availability
4. When booking appointments, it uses `book_business_service` to create actual bookings

## Setup and Configuration

### Creating an Assistant

1. Navigate to the AI Assistant settings page
2. Configure the assistant settings:
   - Model: Select the OpenAI model to use
   - Temperature: Set the creativity level
   - Voice: Select the voice for the assistant
   - First Message: Set the initial greeting
   - System Prompt: Define the assistant's behavior
3. Click "Activate Assistant" to create the assistant

### Customizing the Assistant

1. Edit the system prompt to change the assistant's behavior
2. Edit the first message to change the initial greeting
3. Configure the voice settings to change how the assistant sounds

## Best Practices

1. **Use Clear Service Names**: Make service names descriptive and clear
2. **Set Accurate Availability**: Ensure service availability is correctly configured
3. **Test Regularly**: Test the assistant regularly to ensure it's providing accurate information
4. **Update Service Information**: Keep service information up to date

## Troubleshooting

### Common Issues

1. **Assistant Not Responding**: Check if the assistant is activated
2. **Incorrect Business Information**: Update the business profile
3. **Incorrect Service Information**: Update the service information
4. **Availability Issues**: Check service availability settings
5. **Booking Issues**: Verify booking settings and service availability

### Logs

Check the following logs for troubleshooting:

1. Server logs for API errors
2. Vapi logs for voice-related issues
3. Database logs for data-related issues

## Future Enhancements

1. **Multi-language Support**: Add support for multiple languages
2. **Custom Voice Training**: Allow businesses to train custom voices
3. **Advanced Booking Features**: Add support for recurring bookings, cancellations, etc.
4. **Integration with Other Systems**: Add integration with other business systems
5. **Analytics**: Add analytics to track assistant usage and performance 
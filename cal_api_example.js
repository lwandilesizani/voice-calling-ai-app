// Cal.com API Integration Example
require('dotenv').config({ path: '.env.local' });

const axios = require('axios');

// Get API key from environment variables
const API_KEY = process.env.CALCOM_API_KEY;
const EVENT_TYPE_ID = process.env.CALCOM_EVENT_TYPE_ID;

// Base URL for Cal.com API
const BASE_URL = 'https://api.cal.com/v1';

// Common headers for all requests
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

// Function to get event types
async function getEventTypes() {
  try {
    const response = await axios.get(`${BASE_URL}/event-types`, {
      headers,
      params: { apiKey: API_KEY }
    });
    
    console.log('Event Types:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error fetching event types:', error.response?.data || error.message);
    throw error;
  }
}

// Function to create a booking
async function createBooking(eventTypeId, startTime, endTime, attendeeEmail, attendeeName) {
  try {
    const bookingData = {
      eventTypeId,
      start: startTime,
      end: endTime,
      timeZone: 'UTC',
      language: 'en',
      metadata: {},
      responses: {
        email: attendeeEmail,
        name: attendeeName
      },
      attendees: [
        {
          email: attendeeEmail,
          name: attendeeName,
          timeZone: 'UTC',
          language: 'en'
        }
      ]
    };

    const response = await axios.post(`${BASE_URL}/bookings`, bookingData, {
      headers,
      params: { apiKey: API_KEY }
    });
    
    console.log('Booking created:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
async function main() {
  try {
    // Get event types
    console.log('Fetching event types...');
    const eventTypes = await getEventTypes();
    
    // Create a booking (uncomment to test)
    /*
    console.log('\nCreating a booking...');
    const booking = await createBooking(
      EVENT_TYPE_ID,
      '2025-03-06T10:00:00Z',
      '2025-03-06T10:30:00Z',
      'client@example.com',
      'Client Name'
    );
    */
  } catch (error) {
    console.error('Error in main function:', error.message);
  }
}

// Run the example
main(); 
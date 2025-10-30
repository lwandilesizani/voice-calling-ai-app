# Development Roadmap

This document outlines the upcoming development priorities for the AI Dialer proof-of-concept.

## Priority Tasks

### 1. Call Status Management
- Implement maximum call duration checker
- Create process to reset stale "calling" states
- Add logging for status changes
- Implement error handling for edge cases

### 2. Dashboard Development
- Create dashboard UI for call activity overview
- Implement recent calls summary
- Add key metrics and statistics
- Include data visualization components

### 3. Lead Management Enhancement
- Implement lead search functionality
- Add filtering capabilities to lead table
- Make visible columns selectable

### 4. Live Call Monitoring
- Implement real-time call monitoring and control capabilities
- Integrate Vapi's listenUrl parameter for call audio monitoring
- Integrate Vapi's controlUrl parameter for call control features
- Add UI elements for monitoring and controlling active calls
- We can use the parameter values we cached in the call_logs table

### 5. Booking Information Enhancement
- Implement hover popup for "scheduled" badges
- Integrate Cal.com API for real-time booking information retrieval
- Display comprehensive booking details using stored booking IDs
- Ensure efficient caching and loading of booking data
- We can use the unique booking ID we saved in the lead's record when the booking was confirmed

### 6. Cal.com Integration Endpoint
- Create api/integrations/calcom/route.ts webhook endpoint
- Implement real-time webhook handling for booking updates
- Add notification system for booking amendments and cancellations
- Update lead records based on Cal.com webhook events
- Implement proper error handling and logging

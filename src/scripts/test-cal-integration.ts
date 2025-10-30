import { getAvailability, createBooking } from '../lib/cal';

async function testCalIntegration() {
  console.log('Testing Cal.com integration...');
  
  // Test availability
  console.log('Fetching availability...');
  const availabilityResult = await getAvailability(5);
  console.log('Availability result:', JSON.stringify(availabilityResult, null, 2));
  
  if (!availabilityResult.success) {
    console.error('Failed to fetch availability:', availabilityResult.error);
    return;
  }
  
  console.log(`Found ${availabilityResult.availability?.slots.length || 0} available slots`);
  
  // Don't actually create a booking in the test
  console.log('Cal.com integration test completed');
}

// Run the test
testCalIntegration().catch(error => {
  console.error('Test failed with error:', error);
}); 
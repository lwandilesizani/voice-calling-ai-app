#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { execSync } = require('child_process');
const path = require('path');

console.log('Starting Vapi tools and assistant fix...');

// Set the hardcoded URL as an environment variable
process.env.NEXT_PUBLIC_APP_URL = 'https://7ae14e7d-9684-4ad1-86c0-42a0a3abda47-00-1q4kt89zrpvu0.riker.replit.dev';

try {
  console.log('\n1. Republishing tools with updated URLs...');
  execSync('node vapi/publish-vapi-config.js update', { stdio: 'inherit' });
  
  console.log('\n2. Updating assistant with correct server URL...');
  execSync('node vapi/update-assistant.js', { stdio: 'inherit' });
  
  console.log('\n✅ Fix completed successfully!');
  console.log('\nYour AI assistant should now be able to use tools properly.');
  console.log('Try making a test call and asking about business services or information.');
} catch (error) {
  console.error('\n❌ Error during fix:', error.message);
  process.exit(1);
} 
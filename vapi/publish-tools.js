#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://7ae14e7d-9684-4ad1-86c0-42a0a3abda47-00-1q4kt89zrpvu0.riker.replit.dev';
const VAPI_SECRET_KEY = process.env.VAPI_SECRET_KEY || 'your-vapi-secret-key';

// Tool definitions to publish
const TOOLS_DIR = path.join(__dirname, 'tools');
const TOOLS = [
  'get_customer_bookings.json',
  'update_booking.json'
];

async function publishTool(toolFile) {
  try {
    console.log(`Publishing tool: ${toolFile}`);
    
    // Read the tool definition
    const toolPath = path.join(TOOLS_DIR, toolFile);
    const toolDefinition = JSON.parse(fs.readFileSync(toolPath, 'utf8'));
    
    // Replace placeholders in the URL and secret
    if (toolDefinition.server && toolDefinition.server.url) {
      toolDefinition.server.url = toolDefinition.server.url.replace('${BASE_URL}', BASE_URL);
    }
    
    if (toolDefinition.server && toolDefinition.server.secret) {
      toolDefinition.server.secret = toolDefinition.server.secret.replace('${VAPI_SECRET_KEY}', VAPI_SECRET_KEY);
    }
    
    // Publish the tool to Vapi - using the correct endpoint
    // The endpoint has changed from /functions to /tool (not /function)
    const command = `curl -X POST https://api.vapi.ai/tool \\
      -H "Authorization: Bearer ${VAPI_API_KEY}" \\
      -H "Content-Type: application/json" \\
      -d '${JSON.stringify(toolDefinition)}'`;
    
    const result = execSync(command, { encoding: 'utf8' });
    console.log(`Tool ${toolFile} published successfully:`, result);
    
    return true;
  } catch (error) {
    console.error(`Error publishing tool ${toolFile}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Starting tool publishing process...');
  
  if (!VAPI_API_KEY) {
    console.error('VAPI_API_KEY environment variable is not set. Please set it before running this script.');
    process.exit(1);
  }
  
  console.log(`Using base URL: ${BASE_URL}`);
  console.log(`Using Vapi secret key: ${VAPI_SECRET_KEY}`);
  
  let success = true;
  
  // Publish each tool
  for (const tool of TOOLS) {
    const result = await publishTool(tool);
    if (!result) {
      success = false;
    }
  }
  
  if (success) {
    console.log('\n✅ All tools published successfully!');
    console.log('\nNext steps:');
    console.log('1. Update the system prompt in the My Assistants page');
    console.log('2. Test the new booking flow');
  } else {
    console.error('\n❌ Some tools failed to publish. Please check the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 
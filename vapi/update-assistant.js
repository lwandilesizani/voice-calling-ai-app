#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const VAPI_BASE_URL = 'https://api.vapi.ai';
const CONFIG_FILE = path.join(__dirname, 'vapi-config.json');

async function loadConfig() {
  try {
    const config = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(config);
  } catch (error) {
    console.error('Error loading config:', error);
    process.exit(1);
  }
}

async function makeRequest(endpoint, method, body = null) {
  const url = `${VAPI_BASE_URL}${endpoint}`;
  console.log(`Making ${method} request to ${url}`);
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

async function updateAssistant() {
  try {
    // Load the current configuration
    const config = await loadConfig();
    
    if (!config.assistantId) {
      console.error('No assistant ID found in config. Please create an assistant first.');
      process.exit(1);
    }
    
    console.log(`Updating assistant ${config.assistantId} with tool IDs...`);
    
    // Get the tool IDs
    const toolIds = Object.values(config.toolIds).filter(id => id);
    
    if (toolIds.length === 0) {
      console.error('No tool IDs found in config. Please create tools first.');
      process.exit(1);
    }
    
    console.log('Tool IDs:', toolIds);
    
    // Update the assistant with the tool IDs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://7ae14e7d-9684-4ad1-86c0-42a0a3abda47-00-1q4kt89zrpvu0.riker.replit.dev';
    const updatePayload = {
      model: {
        toolIds: toolIds
      },
      server: {
        url: `${baseUrl}/api/integrations/vapi`,
        secret: process.env.VAPI_SECRET_KEY
      }
    };
    
    const response = await makeRequest(`/assistant/${config.assistantId}`, 'PATCH', updatePayload);
    
    console.log('Assistant updated successfully:', response);
  } catch (error) {
    console.error('Error updating assistant:', error);
    process.exit(1);
  }
}

// Run the update
updateAssistant(); 
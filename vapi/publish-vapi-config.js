#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs').promises;
const path = require('path');

// Parse command line arguments
const args = require('minimist')(process.argv.slice(2), {
    string: ['env-file', 'vapi-key', 'vapi-secret', 'base-url'],
    alias: {
        e: 'env-file',
        k: 'vapi-key',
        s: 'vapi-secret',
        u: 'base-url'
    },
    default: {
        'env-file': path.join(__dirname, '..', '.env.local')
    }
});

// Configuration
const VAPI_BASE_URL = 'https://api.vapi.ai';
const CONFIG_FILE = path.join(__dirname, 'vapi-config.json');

const command = args._[0];
if (!command || !['create', 'update'].includes(command)) {
    console.log('Usage: ./publish-vapi-config.js <command> [options]');
    console.log('\nCommands:');
    console.log('  create    Create new tools and assistant');
    console.log('  update    Update existing tools and assistant');
    console.log('\nOptions:');
    console.log('  -e, --env-file   Path to environment file (default: "../.env.local")');
    console.log('  -k, --vapi-key     VAPI API key (overrides env file)');
    console.log('  -s, --vapi-secret  VAPI Secret key (overrides env file)');
    console.log('  -u, --base-url     Base URL for endpoints (overrides env file)');
    process.exit(1);
}

// Load environment variables
if (args['env-file']) {
    try {
        require('dotenv').config({ path: args['env-file'] });
    } catch {
        console.warn(`Warning: Could not load environment file: ${args['env-file']}`);
        console.warn('Continuing with command line arguments or existing environment variables...');
    }
}

// Get configuration values with priority:
// 1. Command line arguments
// 2. Environment variables
// 3. Fail if neither exists
const getConfig = () => {
    const vapiKey = args['vapi-key'] || process.env.VAPI_API_KEY;
    const vapiSecret = args['vapi-secret'] || process.env.VAPI_SECRET_KEY;
    const baseUrl = args['base-url'] || process.env.AI_DIALER_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://7ae14e7d-9684-4ad1-86c0-42a0a3abda47-00-1q4kt89zrpvu0.riker.replit.dev';

    if (!vapiKey) {
        console.error('Error: VAPI API key not provided');
        console.error('Provide it via --vapi-key argument or VAPI_API_KEY environment variable');
        process.exit(1);
    }

    if (!vapiSecret) {
        console.error('Error: VAPI Secret key not provided');
        console.error('Provide it via --vapi-secret argument or VAPI_SECRET_KEY environment variable');
        process.exit(1);
    }

    console.log('Using base URL:', baseUrl);

    return { vapiKey, vapiSecret, baseUrl };
};

async function loadConfig() {
    try {
        const config = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(config);
    } catch {
        // If file doesn't exist or is invalid, return empty config
        return {
            toolIds: {},
            assistantId: null
        };
    }
}

async function saveConfig(config) {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

async function makeRequest(endpoint, method, body = null) {
    const url = `${VAPI_BASE_URL}${endpoint}`;
    console.log(`\nMaking ${method} request to ${endpoint}`);
    if (body) {
        console.log('Request body:', JSON.stringify(body, null, 2));
    }

    const config = getConfig();
    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.vapiKey}`
        },
        body: body ? JSON.stringify(body) : undefined
    });

    let responseData;
    try {
        responseData = await response.json();
    } catch (error) {
        console.error('Failed to parse response as JSON:', error);
        console.log('Response text:', await response.text());
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
        console.log('Error response:', JSON.stringify(responseData, null, 2));
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${JSON.stringify(responseData)}`);
    }

    console.log('Response:', JSON.stringify(responseData, null, 2));
    return responseData;
}

async function publishConfig() {
    try {
        // Load configs
        const getBusinessInfoConfig = JSON.parse(await fs.readFile(path.join(__dirname, 'tools', 'get_business_info.json'), 'utf8'));
        const listBusinessServicesConfig = JSON.parse(await fs.readFile(path.join(__dirname, 'tools', 'list_business_services.json'), 'utf8'));
        const bookBusinessServiceConfig = JSON.parse(await fs.readFile(path.join(__dirname, 'tools', 'book_business_service.json'), 'utf8'));
        const getBusinessAvailabilityConfig = JSON.parse(await fs.readFile(path.join(__dirname, 'tools', 'get_business_availability.json'), 'utf8'));
        const getCustomerBookingsConfig = JSON.parse(await fs.readFile(path.join(__dirname, 'tools', 'get_customer_bookings.json'), 'utf8'));
        const updateBookingConfig = JSON.parse(await fs.readFile(path.join(__dirname, 'tools', 'update_booking.json'), 'utf8'));
        const assistantConfig = JSON.parse(await fs.readFile(path.join(__dirname, 'assistant_config.json'), 'utf8'));
        
        // Load existing IDs
        const config = await loadConfig();
        
        // Variables to replace in configs
        const variables = {
            BASE_URL: getConfig().baseUrl,
            TOOL_ID_GET_BUSINESS_INFO: config.toolIds.getBusinessInfo || '',
            TOOL_ID_LIST_BUSINESS_SERVICES: config.toolIds.listBusinessServices || '',
            TOOL_ID_BOOK_BUSINESS_SERVICE: config.toolIds.bookBusinessService || '',
            TOOL_ID_GET_BUSINESS_AVAILABILITY: config.toolIds.getBusinessAvailability || '',
            VAPI_SECRET_KEY: getConfig().vapiSecret
        };

        // Replace variables in configs
        const processedGetBusinessInfo = replaceVariables(getBusinessInfoConfig, variables);
        const processedListBusinessServices = replaceVariables(listBusinessServicesConfig, variables);
        const processedBookBusinessService = replaceVariables(bookBusinessServiceConfig, variables);
        const processedGetBusinessAvailability = replaceVariables(getBusinessAvailabilityConfig, variables);
        const processedGetCustomerBookings = replaceVariables(getCustomerBookingsConfig, variables);
        const processedUpdateBooking = replaceVariables(updateBookingConfig, variables);
        const processedAssistant = replaceVariables(assistantConfig, variables);
        
        console.log('\nPublishing VAPI configurations...');

        // Create/update get business info tool
        console.log('\n1. Get Business Info Tool');
        if (config.toolIds.getBusinessInfo && command === 'update') {
            console.log('Updating existing tool...');
            const updatePayload = { ...processedGetBusinessInfo };
            delete updatePayload.type;  // Remove type field for updates
            const response = await makeRequest(`/tool/${config.toolIds.getBusinessInfo}`, 'PATCH', updatePayload);
            config.toolIds.getBusinessInfo = response.id;
        } else if (command === 'create') {
            console.log('Creating new tool...');
            const response = await makeRequest('/tool', 'POST', processedGetBusinessInfo);
            config.toolIds.getBusinessInfo = response.id;
        }

        // Create/update list business services tool
        console.log('\n2. List Business Services Tool');
        if (config.toolIds.listBusinessServices && command === 'update') {
            console.log('Updating existing tool...');
            const updatePayload = { ...processedListBusinessServices };
            delete updatePayload.type;  // Remove type field for updates
            const response = await makeRequest(`/tool/${config.toolIds.listBusinessServices}`, 'PATCH', updatePayload);
            config.toolIds.listBusinessServices = response.id;
        } else if (command === 'create') {
            console.log('Creating new tool...');
            const response = await makeRequest('/tool', 'POST', processedListBusinessServices);
            config.toolIds.listBusinessServices = response.id;
        }

        // Create/update book business service tool
        console.log('\n3. Book Business Service Tool');
        if (config.toolIds.bookBusinessService && command === 'update') {
            console.log('Updating existing tool...');
            const updatePayload = { ...processedBookBusinessService };
            delete updatePayload.type;  // Remove type field for updates
            const response = await makeRequest(`/tool/${config.toolIds.bookBusinessService}`, 'PATCH', updatePayload);
            config.toolIds.bookBusinessService = response.id;
        } else if (command === 'create') {
            console.log('Creating new tool...');
            const response = await makeRequest('/tool', 'POST', processedBookBusinessService);
            config.toolIds.bookBusinessService = response.id;
        }

        // Create/update get business availability tool
        console.log('\n4. Get Business Availability Tool');
        if (config.toolIds.getBusinessAvailability && command === 'update') {
            console.log('Updating existing tool...');
            const updatePayload = { ...processedGetBusinessAvailability };
            delete updatePayload.type;  // Remove type field for updates
            const response = await makeRequest(`/tool/${config.toolIds.getBusinessAvailability}`, 'PATCH', updatePayload);
            config.toolIds.getBusinessAvailability = response.id;
        } else if (command === 'create') {
            console.log('Creating new tool...');
            const response = await makeRequest('/tool', 'POST', processedGetBusinessAvailability);
            config.toolIds.getBusinessAvailability = response.id;
        }

        // Create/update get customer bookings tool
        console.log('\n5. Get Customer Bookings Tool');
        if (config.toolIds.getCustomerBookings && command === 'update') {
            console.log('Updating existing tool...');
            const updatePayload = { ...processedGetCustomerBookings };
            delete updatePayload.type;  // Remove type field for updates
            const response = await makeRequest(`/tool/${config.toolIds.getCustomerBookings}`, 'PATCH', updatePayload);
            config.toolIds.getCustomerBookings = response.id;
        } else if (command === 'create') {
            console.log('Creating new tool...');
            const response = await makeRequest('/tool', 'POST', processedGetCustomerBookings);
            config.toolIds.getCustomerBookings = response.id;
        }

        // Create/update update booking tool
        console.log('\n6. Update Booking Tool');
        if (config.toolIds.updateBooking && command === 'update') {
            console.log('Updating existing tool...');
            const updatePayload = { ...processedUpdateBooking };
            delete updatePayload.type;  // Remove type field for updates
            const response = await makeRequest(`/tool/${config.toolIds.updateBooking}`, 'PATCH', updatePayload);
            config.toolIds.updateBooking = response.id;
        } else if (command === 'create') {
            console.log('Creating new tool...');
            const response = await makeRequest('/tool', 'POST', processedUpdateBooking);
            config.toolIds.updateBooking = response.id;
        }

        // Update tool IDs in assistant config
        processedAssistant.model.toolIds = [
            config.toolIds.getBusinessInfo,
            config.toolIds.listBusinessServices,
            config.toolIds.bookBusinessService,
            config.toolIds.getBusinessAvailability,
            config.toolIds.getCustomerBookings,
            config.toolIds.updateBooking
        ].filter(id => id); // Filter out any empty IDs

        // Create/update assistant
        console.log('\n7. Assistant');
        if (config.assistantId && command === 'update') {
            console.log('Updating existing assistant...');
            const response = await makeRequest(`/assistant/${config.assistantId}`, 'PATCH', processedAssistant);
            config.assistantId = response.id;
        } else if (command === 'create') {
            console.log('Creating new assistant...');
            const response = await makeRequest('/assistant', 'POST', processedAssistant);
            config.assistantId = response.id;
        }

        // Save updated config
        await saveConfig(config);
        console.log('\nConfiguration published successfully!');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Helper function to replace variables in config
function replaceVariables(obj, variables) {
    const str = JSON.stringify(obj);
    
    // First pass to handle special cases like URLs
    let processedStr = str;
    
    // Handle server URLs to prevent path duplication
    if (str.includes('"url":') && str.includes('/api/vapi/booking-tools/')) {
        // Make sure we don't have duplicate paths
        processedStr = processedStr.replace(/\/api\/integrations\/vapi\/api\/vapi\/booking-tools\//g, '/api/vapi/booking-tools/');
    }
    
    // Second pass to replace variables
    const replaced = processedStr.replace(/\${([^}]+)}/g, (match, key) => {
        return variables[key] || match;
    });
    
    return JSON.parse(replaced);
}

publishConfig();

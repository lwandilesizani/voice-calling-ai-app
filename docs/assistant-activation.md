# AI Assistant Activation and Deactivation

## Overview

This document explains how the AI assistant is activated and deactivated in the system. The activation process creates a new assistant in the Vapi platform, while the deactivation process deletes the assistant from Vapi and updates the local database.

## Activation Process

When a user activates an AI assistant, the following steps occur:

1. The user clicks the "Activate Assistant" button in the UI
2. The system sends a PUT request to `/api/vapi/assistant`
3. The API endpoint:
   - Retrieves the assistant configuration from the database
   - Loads the latest template files for system prompt and first message
   - Replaces placeholders with actual business data (e.g., business name)
   - Updates the database with the template-based messages
   - Creates a new assistant in Vapi with the updated configuration
   - Updates the database with the new assistant ID
   - Sets the assistant as active in the database
4. The UI is updated to show the assistant is active

## Deactivation Process

When a user deactivates an AI assistant, the following steps occur:

1. The user clicks the "Deactivate Assistant" button in the UI
2. The system sends a DELETE request to `/api/vapi/assistant/delete?id={assistantId}`
3. The API endpoint:
   - Verifies the assistant belongs to the current business
   - Deletes the assistant from Vapi using the Vapi API
   - Updates the database to set the assistant as inactive
   - Removes the assistant ID from the database
4. The UI is updated to show the assistant is inactive

## Implementation Details

### API Endpoints

- **PUT /api/vapi/assistant**: Creates a new assistant in Vapi
- **DELETE /api/vapi/assistant/delete**: Deletes an assistant from Vapi

### Database Updates

When an assistant is activated, the following fields are updated in the `assistant_configs` table:
- `system_prompt`: Updated with the latest template-based system prompt
- `first_message`: Updated with the latest template-based first message
- `assistant_id`: Set to the ID of the newly created assistant
- `is_active`: Set to `true`

When an assistant is deactivated, the following fields are updated in the `assistant_configs` table:
- `assistant_id`: Set to `null`
- `is_active`: Set to `false`

### Template Files

The system uses template files to generate dynamic content:

- **business-system-prompt.md**: Template for the system prompt
- **business-first-message.txt**: Template for the first message

These templates can contain placeholders like `{{business_name}}` that are replaced with actual business data during activation.

### Vapi API Calls

#### Creating an Assistant

```javascript
const vapiResponse = await fetch('https://api.vapi.ai/assistant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
  },
  body: JSON.stringify(vapiRequestBody)
});
```

#### Deleting an Assistant

```javascript
const vapiResponse = await fetch(`https://api.vapi.ai/assistant/${assistantId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${process.env.VAPI_API_KEY}`
  }
});
```

## UI Components

The system provides two UI locations for activating and deactivating assistants:

1. **Settings Page**: Located at `/settings/ai-assistant`
   - Allows configuring the assistant before activation
   - Provides "Activate Assistant" and "Deactivate Assistant" buttons

2. **My Assistants Page**: Located at `/my-assistants`
   - Shows the current status of the assistant
   - Provides "Activate Assistant" and "Deactivate Assistant" buttons
   - Allows refreshing assistant details from Vapi

## Error Handling

The system handles various error scenarios:

- If the assistant creation fails, an error message is displayed
- If the assistant deletion fails, an error message is displayed
- If the assistant doesn't exist on Vapi during deletion, the database is still updated
- If template files cannot be loaded, the system falls back to the stored configuration

## Security Considerations

- Only authenticated users can activate or deactivate assistants
- Users can only manage assistants for their own business
- The Vapi API key is stored securely as an environment variable 
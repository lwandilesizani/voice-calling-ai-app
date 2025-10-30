# Vapi AI Assistant Integration

This document provides instructions on how to integrate and use the Vapi AI voice assistant in your application.

## Setup

### 1. Install Dependencies

```bash
npm install @vapi-ai/web
# or
yarn add @vapi-ai/web
```

### 2. Environment Variables

Create or update your `.env.local` file with the following variables:

```
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_public_key
NEXT_PUBLIC_VAPI_ASSISTANT_ID=your_vapi_assistant_id
```

You can find these values in your Vapi Dashboard.

## Components Overview

The integration consists of several components:

### VapiProvider

A context provider that initializes the Vapi instance and makes it available throughout your application.

```jsx
import { VapiProvider } from '../components/VapiProvider';

// Wrap your component or page with the provider
<VapiProvider>
  <YourComponent />
</VapiProvider>
```

### VapiMicrophoneButton

A simple button component that allows users to start and stop conversations with the Vapi assistant.

```jsx
import VapiMicrophoneButton from '../components/VapiMicrophoneButton';

// Basic usage
<VapiMicrophoneButton assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID} />

// With custom configuration
<VapiMicrophoneButton 
  assistantConfig={{
    model: {
      provider: "openai",
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful booking assistant.",
        },
      ],
    },
    voice: {
      provider: "playht",
      voiceId: "jennifer",
    },
  }}
  buttonText={{
    idle: "Ask for Help",
    listening: "Stop Listening",
    loading: "Starting...",
  }}
  className="custom-button-class"
/>
```

### VapiConversation

A more advanced component that includes the microphone button and displays the conversation transcript.

```jsx
import VapiConversation from '../components/VapiConversation';

// Basic usage
<VapiConversation assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID} />

// With custom configuration
<VapiConversation 
  assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID}
  assistantOverrides={{
    variableValues: {
      name: "John",
    },
  }}
  showTranscript={true}
  maxMessages={10}
/>
```

## Styling

The components come with default styling in `styles/vapi.css`. You can customize the appearance by overriding these styles or adding your own classes.

## Advanced Usage

### Sending Custom Messages

You can send custom messages to the assistant during a conversation using the Vapi instance:

```jsx
import { useVapi } from '../components/VapiProvider';

function YourComponent() {
  const { vapi, isInitialized } = useVapi();
  
  const sendCustomMessage = () => {
    if (vapi && isInitialized) {
      vapi.send({
        type: "add-message",
        message: {
          role: "system",
          content: "The user has selected the premium package.",
        },
      });
    }
  };
  
  return (
    <button onClick={sendCustomMessage}>
      Select Premium Package
    </button>
  );
}
```

### Listening to Events

You can listen to various events from the Vapi instance:

```jsx
import { useEffect } from 'react';
import { useVapi } from '../components/VapiProvider';

function YourComponent() {
  const { vapi, isInitialized } = useVapi();
  
  useEffect(() => {
    if (!vapi || !isInitialized) return;
    
    vapi.on('call-start', () => {
      console.log('Call started');
    });
    
    vapi.on('call-end', () => {
      console.log('Call ended');
    });
    
    vapi.on('speech-start', () => {
      console.log('Assistant started speaking');
    });
    
    vapi.on('speech-end', () => {
      console.log('Assistant stopped speaking');
    });
    
    vapi.on('error', (error) => {
      console.error('Vapi error:', error);
    });
    
    // Clean up event listeners
    return () => {
      vapi.off('call-start');
      vapi.off('call-end');
      vapi.off('speech-start');
      vapi.off('speech-end');
      vapi.off('error');
    };
  }, [vapi, isInitialized]);
  
  return <div>Your component content</div>;
}
```

## Troubleshooting

### Common Issues

1. **Microphone access denied**: Ensure that the user has granted microphone permissions to the browser.
2. **Assistant not responding**: Check that your Vapi public key and assistant ID are correct.
3. **Error events**: Listen to the 'error' event to catch and handle any errors that occur during the call.

### Browser Compatibility

Vapi requires a modern browser with WebRTC support. It works best in Chrome, Firefox, Safari, and Edge. 
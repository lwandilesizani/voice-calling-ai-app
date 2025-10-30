'use client';

import React, { useEffect } from 'react';
import { VapiProvider } from './VapiProvider';
import VapiMicrophoneButton from './VapiMicrophoneButton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface VapiAssistantProps {
  assistantId?: string;
  assistantConfig?: any;
  assistantOverrides?: any;
  title?: string;
  description?: string;
  className?: string;
}

const VapiAssistant: React.FC<VapiAssistantProps> = ({
  assistantId,
  assistantConfig,
  assistantOverrides,
  title = 'AI Assistant',
  description = 'Click the button below to talk to our AI assistant.',
  className = '',
}) => {
  // Use the environment variable if assistantId is not provided
  const effectiveAssistantId = assistantId || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  
  useEffect(() => {
    // Log the assistant ID being used
    console.log('VapiAssistant using assistant ID:', effectiveAssistantId);
    console.log('Provided assistantId:', assistantId);
    console.log('Fallback env var:', process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);
  }, [effectiveAssistantId, assistantId]);

  return (
    <VapiProvider>
      <Card className={`vapi-assistant-card ${className}`}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <VapiMicrophoneButton
            assistantId={effectiveAssistantId}
            assistantConfig={assistantConfig}
            assistantOverrides={assistantOverrides}
            buttonText={{
              idle: 'Talk to AI Assistant',
              listening: 'Stop',
              loading: 'Connecting...',
            }}
          />
        </CardContent>
      </Card>
    </VapiProvider>
  );
};

export default VapiAssistant; 
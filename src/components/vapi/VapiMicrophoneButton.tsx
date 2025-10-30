'use client';

import React, { useEffect, useState } from 'react';
import { useVapi } from './VapiProvider';
import { Button } from '@/components/ui/button';

interface VapiMicrophoneButtonProps {
  assistantId?: string;
  assistantConfig?: any;
  assistantOverrides?: any;
  className?: string;
  buttonText?: {
    idle?: string;
    listening?: string;
    loading?: string;
  };
}

const VapiMicrophoneButton: React.FC<VapiMicrophoneButtonProps> = ({
  assistantId,
  assistantConfig,
  assistantOverrides,
  className = '',
  buttonText = {
    idle: 'Talk to AI',
    listening: 'Stop',
    loading: 'Connecting...',
  },
}) => {
  const { vapi, isInitialized } = useVapi();
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);

  useEffect(() => {
    if (!vapi || !isInitialized) return;

    const setupEventListeners = () => {
      vapi.on('call-start', () => {
        console.log('Vapi call started successfully');
        setIsListening(true);
        setIsLoading(false);
        setError(null);
      });

      vapi.on('call-end', () => {
        console.log('Vapi call ended');
        setIsListening(false);
        setIsLoading(false);
      });

      vapi.on('error', (error: any) => {
        console.error('Vapi error:', error);
        let errorMessage = 'An unknown error occurred';
        
        if (error && error.message) {
          errorMessage = error.message;
        } else if (error && error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && error.status === 403) {
          errorMessage = 'Authentication failed. Please check your API key.';
        }
        
        setError(`Error: ${errorMessage}`);
        setIsListening(false);
        setIsLoading(false);
      });

      vapi.on('volume-level', (volume: number) => {
        setVolumeLevel(volume);
      });
    };

    setupEventListeners();

    // Cleanup function
    return () => {
      if (vapi) {
        vapi.stop();
      }
    };
  }, [vapi, isInitialized]);

  const handleMicClick = async () => {
    if (!vapi || !isInitialized) {
      setError('Vapi is not initialized');
      return;
    }

    if (isListening) {
      vapi.stop();
    } else {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Starting Vapi call with:', { 
          assistantId, 
          assistantOverrides,
          publicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.substring(0, 8) + '...'
        });
        
        if (assistantId) {
          console.log(`Using business-specific assistant ID: ${assistantId}`);
          await vapi.start(assistantId, assistantOverrides);
        } else if (assistantConfig) {
          console.log('Using assistant config instead of ID');
          await vapi.start(assistantConfig);
        } else {
          console.error('No assistant ID or config provided');
          throw new Error('Either assistantId or assistantConfig must be provided');
        }
      } catch (error: any) {
        console.error('Error starting Vapi call:', error);
        
        let errorMessage = 'Failed to start call';
        if (error && error.message) {
          errorMessage += `: ${error.message}`;
        } else if (error && error.error && error.error.message) {
          errorMessage += `: ${error.error.message}`;
        } else if (error && error.status === 403) {
          errorMessage += ': Authentication failed. Please check your API key.';
        }
        
        setError(errorMessage);
        setIsLoading(false);
      }
    }
  };

  // Calculate button styles based on state
  const getButtonLabel = () => {
    if (isLoading) return buttonText.loading;
    if (isListening) return buttonText.listening;
    return buttonText.idle;
  };

  return (
    <div className="vapi-microphone-container">
      <Button
        onClick={handleMicClick}
        disabled={isLoading || !isInitialized}
        className={`vapi-microphone-button ${className} ${isListening ? 'listening' : ''}`}
        variant={isListening ? "destructive" : "default"}
        size="lg"
      >
        {getButtonLabel()}
      </Button>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </div>
  );
};

export default VapiMicrophoneButton; 
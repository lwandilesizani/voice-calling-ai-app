import React, { useEffect, useState } from 'react';
import { useVapi } from './VapiProvider';

interface VapiMicrophoneButtonProps {
  assistantId?: string;
  assistantConfig?: any; // You can type this more specifically based on your needs
  assistantOverrides?: any; // You can type this more specifically based on your needs
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
        setIsListening(true);
        setIsLoading(false);
        setError(null);
      });

      vapi.on('call-end', () => {
        setIsListening(false);
        setIsLoading(false);
      });

      vapi.on('error', (error: any) => {
        console.error('Vapi error:', error);
        setError(`An error occurred: ${error.message || 'Unknown error'}`);
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
      try {
        if (assistantId) {
          await vapi.start(assistantId, assistantOverrides);
        } else if (assistantConfig) {
          await vapi.start(assistantConfig);
        } else {
          throw new Error('Either assistantId or assistantConfig must be provided');
        }
      } catch (error: any) {
        console.error('Error starting Vapi:', error);
        setError(`Failed to start call: ${error.message || 'Unknown error'}`);
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

  // Calculate animation styles for volume visualization
  const animationStyle = {
    transform: `scale(${1 + volumeLevel * 0.5})`,
    transition: 'transform 0.1s ease-in-out',
  };

  return (
    <div className="vapi-microphone-container">
      <button
        onClick={handleMicClick}
        disabled={isLoading || !isInitialized}
        className={`vapi-microphone-button ${className} ${isListening ? 'listening' : ''}`}
        style={isListening ? animationStyle : undefined}
      >
        {getButtonLabel()}
      </button>
      {error && <div className="vapi-error-message">{error}</div>}
    </div>
  );
};

export default VapiMicrophoneButton; 
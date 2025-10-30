import React, { useEffect, useState, useRef } from 'react';
import { useVapi } from './VapiProvider';
import VapiMicrophoneButton from './VapiMicrophoneButton';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface VapiConversationProps {
  assistantId?: string;
  assistantConfig?: any;
  assistantOverrides?: any;
  className?: string;
  showTranscript?: boolean;
  maxMessages?: number;
}

const VapiConversation: React.FC<VapiConversationProps> = ({
  assistantId,
  assistantConfig,
  assistantOverrides,
  className = '',
  showTranscript = true,
  maxMessages = 10,
}) => {
  const { vapi, isInitialized } = useVapi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!vapi || !isInitialized) return;

    const handleMessage = (message: any) => {
      // Handle different message types from Vapi
      if (message.type === 'transcript') {
        // Add user transcript to messages
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          
          // If the last message is from the user and not finalized, update it
          if (lastMessage && lastMessage.role === 'user' && !message.transcript.isFinal) {
            lastMessage.content = message.transcript.text;
            return [...newMessages];
          } 
          
          // If it's a final transcript or a new user message
          if (message.transcript.isFinal) {
            return [
              ...newMessages,
              {
                role: 'user' as const,
                content: message.transcript.text,
                timestamp: new Date(),
              },
            ].slice(-maxMessages);
          }
          
          return newMessages;
        });
      } else if (message.type === 'assistant-response') {
        // Add assistant response to messages
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: 'assistant' as const,
            content: message.text,
            timestamp: new Date(),
          },
        ].slice(-maxMessages));
      }
    };

    vapi.on('message', handleMessage);
    
    vapi.on('speech-start', () => {
      setIsAssistantSpeaking(true);
    });
    
    vapi.on('speech-end', () => {
      setIsAssistantSpeaking(false);
    });

    return () => {
      // Clean up event listeners
      vapi.off('message', handleMessage);
      vapi.off('speech-start');
      vapi.off('speech-end');
    };
  }, [vapi, isInitialized, maxMessages]);

  // Function to send a custom message to the assistant
  const sendMessage = (content: string) => {
    if (!vapi || !isInitialized) return;
    
    vapi.send({
      type: 'add-message',
      message: {
        role: 'user',
        content,
      },
    });
    
    // Add the message to the UI
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: 'user' as const,
        content,
        timestamp: new Date(),
      },
    ].slice(-maxMessages));
  };

  return (
    <div className={`vapi-conversation ${className}`}>
      {showTranscript && messages.length > 0 && (
        <div className="vapi-transcript">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`vapi-message ${message.role}`}
            >
              <div className="vapi-message-content">
                {message.content}
              </div>
              <div className="vapi-message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
      
      <div className="vapi-controls">
        <VapiMicrophoneButton 
          assistantId={assistantId}
          assistantConfig={assistantConfig}
          assistantOverrides={assistantOverrides}
        />
        {isAssistantSpeaking && (
          <div className="vapi-speaking-indicator">
            Assistant is speaking...
          </div>
        )}
      </div>
    </div>
  );
};

export default VapiConversation; 
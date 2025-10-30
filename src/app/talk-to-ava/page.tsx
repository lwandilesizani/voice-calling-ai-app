'use client'

import { useState, useEffect, useRef } from 'react'
import { useChat, Message } from "@ai-sdk/react"
import { Bot, Send, User } from 'lucide-react'

export default function TalkToAvaPage() {
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-message',
      role: 'assistant',
      content: "Hello! I'm Ava, your AI assistant. I can help you with various tasks including working with files, accessing recruiter information, and managing your documents. How can I assist you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // For debugging
  useEffect(() => {
    console.log("Current messages:", messages);
    
    // Log detailed info about the last message if it exists
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      console.log("Last message details:", {
        id: lastMessage.id,
        role: lastMessage.role,
        content: lastMessage.content,
        contentLength: lastMessage.content?.length || 0,
        isLoading
      });
    }
  }, [messages, isLoading]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    if (messageContainerRef.current) {
      messageContainerRef.current.classList.add("grow");
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Create a placeholder for the assistant's response
      const assistantMessageId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: ''
      }]);
      
      // Make the API request
      const response = await fetch('/api/booker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage)
        })
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`);
      }
      
      // Process the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      
      let assistantMessage = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        
        // Process each line in the chunk
        const lines = chunk.split('\n\n');
        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          try {
            const eventData = JSON.parse(line.substring(6));
            
            if (eventData.type === 'text') {
              assistantMessage += eventData.text;
              // Update the assistant message with the new content
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content = assistantMessage;
                }
                return newMessages;
              });
            } else if (eventData.type === 'error') {
              setError(new Error(eventData.error));
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e, line);
          }
        }
      }
    } catch (err) {
      console.error('Error in chat request:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="w-full h-[80vh] flex flex-col border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Talk to Ava</h1>
          <p className="text-sm text-gray-500">
            Your AI assistant powered by LangChain
          </p>
        </div>
        
        <div 
          ref={messageContainerRef}
          className="flex-1 overflow-auto p-4" 
          id="chat-messages"
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-gray-500">
                  Start a conversation with Ava...
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.role === 'user' ? (
                        <>
                          <span className="font-medium">You</span>
                          <User className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Bot className="h-4 w-4" />
                          <span className="font-medium">Ava</span>
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">
                      {message.content || (message.role === 'assistant' && isLoading && messages[messages.length - 1]?.id === message.id) ? 
                        message.content || 
                        <span className="flex items-center">
                          <span className="animate-pulse">Thinking</span>
                          <span className="animate-bounce delay-100">.</span>
                          <span className="animate-bounce delay-200">.</span>
                          <span className="animate-bounce delay-300">.</span>
                        </span> 
                      : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isLoading && messages.length > 0 && !messages[messages.length - 1].content && (
              <div className="flex justify-center">
                <div className="animate-pulse flex space-x-3">
                  <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                  <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                  <div className="h-3 w-3 bg-blue-400 rounded-full"></div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-3 justify-center">
                <div className="rounded-lg px-4 py-2 bg-red-100 text-red-800">
                  <p>Error: {error.message || "Failed to load response"}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-sm underline mt-1"
                  >
                    Refresh the page
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              className="flex-1 px-3 py-2 border rounded-md"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                }
              }}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 
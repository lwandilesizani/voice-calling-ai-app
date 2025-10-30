import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage } from "ai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { Calculator } from "@langchain/community/tools/calculator";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { DynamicTool } from "@langchain/core/tools";
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend';
import { createBookingTools } from './bookingTools';
import { createServiceTools } from './serviceTools';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!
);

// Create Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Utility function to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

interface SupabaseFile {
  name: string;
  metadata: {
    size?: number;
  };
  created_at: string;
}

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message._getType() === "ai" && (message as AIMessage).tool_calls) {
    return {
      content: message.content,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

// Create tools for the agent
const createTools = (userId: string) => {
  if (!userId) {
    throw new Error('User ID is required to create tools');
  }

  // Get booking tools
  const bookingTools = createBookingTools(userId);
  
  // Get service tools
  const serviceTools = createServiceTools(userId);
  
  // Return all tools
  return [
    ...bookingTools,
    ...serviceTools
  ];
};

const AGENT_SYSTEM_TEMPLATE = `You are a helpful AI assistant that can manage bookings and services for a business.

You have access to the following capabilities:
- Create, retrieve, update, and delete bookings
- Create, retrieve, update, and delete services
- Manage service availability and break times
- Find available time slots for services on specific dates
- Calculate basic math operations

Current conversation:
{chat_history}`;

export async function POST(req: NextRequest) {
  const supabase = await createRouteHandlerClient();
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const messages = (body.messages ?? []).map(convertVercelMessageToLangChainMessage);
  
  // Ensure there are messages to process
  if (!messages || messages.length === 0) {
    return new Response('No messages provided', { status: 400 });
  }
  
  const previousMessages = messages.slice(0, -1);
  const currentMessageContent = messages[messages.length - 1].content;

  const userId = user.id;
  const tools = [
    ...createTools(userId),
    new Calculator(),
  ];

  const chatModel = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.2,
  });

  const agent = await createReactAgent({
    llm: chatModel,
    tools,
    messageModifier: new SystemMessage(AGENT_SYSTEM_TEMPLATE),
  });

  const returnIntermediateSteps = body.show_intermediate_steps;

  if (!returnIntermediateSteps) {
    // Create a TextEncoder to convert strings to Uint8Arrays
    const encoder = new TextEncoder();
    
    // Create a TransformStream to handle the streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Start the response stream
    const response = new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
    // Process in the background
    (async () => {
      try {
        // Write the SSE format preamble
        await writer.write(encoder.encode("data: " + JSON.stringify({ type: "message_start", message: { id: Date.now().toString(), role: "assistant", content: "" } }) + "\n\n"));
        
        const eventStream = await agent.streamEvents(
          { messages },
          { version: "v2" }
        );
        
        let fullContent = "";
        
        for await (const { event, data } of eventStream) {
          if (event === "on_chat_model_stream") {
            if (data.chunk.content !== null && data.chunk.content !== undefined) {
              fullContent += data.chunk.content;
              // Send the chunk in SSE format
              await writer.write(encoder.encode("data: " + JSON.stringify({ type: "text", text: data.chunk.content }) + "\n\n"));
            }
          } else if (event === "on_tool_start" && 'tool' in data) {
            // Inform the user that a tool is being used
            const toolMessage = "\n\nProcessing your request...\n";
            fullContent += toolMessage;
            await writer.write(encoder.encode("data: " + JSON.stringify({ type: "text", text: toolMessage }) + "\n\n"));
          } else if (event === "on_tool_end" && 'output' in data) {
            // Inform the user that a tool has completed
            const toolEndMessage = "\nGathered information for your request.\n\n";
            fullContent += toolEndMessage;
            await writer.write(encoder.encode("data: " + JSON.stringify({ type: "text", text: toolEndMessage }) + "\n\n"));
          }
        }
        
        // Send the message_end event
        await writer.write(encoder.encode("data: " + JSON.stringify({ type: "message_end" }) + "\n\n"));
        
        // Close the stream
        await writer.close();
      } catch (error) {
        console.error("Error in streaming response:", error);
        // Send an error message
        await writer.write(encoder.encode("data: " + JSON.stringify({ type: "error", error: "An error occurred while processing your request." }) + "\n\n"));
        await writer.close();
      }
    })();
    
    return response;
  } else {
    const result = await agent.invoke({ messages });
    return NextResponse.json(
      {
        messages: result.messages.map(convertLangChainMessageToVercelMessage),
      },
      { status: 200 },
    );
  }
}
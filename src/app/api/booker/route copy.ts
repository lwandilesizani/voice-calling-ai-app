import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage } from "ai";
import { createDataStreamResponse } from "ai";
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
import { google } from 'googleapis';
import { DynamicTool } from "@langchain/core/tools";
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createClient } from "@supabase/supabase-js";
import { EmailService } from '../../utils/emailService';
import { googleConfig } from '../../config/google';

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_PRIVATE_KEY!
);

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
  if (message._getType() === "human") {
    return { content: message.content, role: "user" };
  } else if (message._getType() === "ai") {
    return {
      content: message.content,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

const createFileTools = (userId: string) => {
  if (!userId) {
    throw new Error('User ID is required to create file tools');
  }

  const listFiles = new DynamicTool({
    name: "list_files",
    description: "List all files in the CV bucket. Use this to find available files.",
    func: async () => {
      try {
        const { data: files, error } = await supabase.storage
          .from('cv')
          .list(`users/${userId}`);

        if (error) throw error;

        if (!files || files.length === 0) {
          return "No files found in your CV folder.";
        }

        return JSON.stringify(files.map(file => ({
          name: file.name,
          size: file.metadata.size,
          created_at: file.created_at,
          path: `users/${userId}/${file.name}`
        })), null, 2);
      } catch (error: any) {
        console.error('Error listing files:', error);
        return `Error listing files: ${error.message}`;
      }
    }
  });

  const getFileUrl = new DynamicTool({
    name: "get_file_url",
    description: "Get the public URL for a file in the CV bucket. Input should be the filename.",
    func: async (filename: string) => {
      try {
        const filePath = filename.startsWith('users/') ? filename : `users/${userId}/${filename}`;
        const { data: { publicUrl } } = supabase.storage
          .from('cv')
          .getPublicUrl(filePath);

        return publicUrl;
      } catch (error: any) {
        return `Error getting file URL: ${error.message}`;
      }
    }
  });

  const sendEmailWithAttachment = new DynamicTool({
    name: "send_email_with_attachment",
    description: "Send an email with file attachments from the user's folder",
    func: async (input: string) => {
      try {
        const { to, subject, body, attachments = [] } = JSON.parse(input);
        
        if (!userId) {
          throw new Error('User ID not available');
        }

        if (!Array.isArray(attachments)) {
          throw new Error('Attachments must be an array of filenames');
        }

        // First verify all files exist before proceeding
        const verifiedAttachments = await Promise.all(attachments.map(async (filename: string) => {
          if (!filename || typeof filename !== 'string') {
            throw new Error('Invalid filename provided');
          }

          const filePath = filename.startsWith('users/') ? filename : `users/${userId}/${filename}`;
          const { data, error } = await supabase.storage
            .from('cv')
            .download(filePath);

          if (error || !data) {
            throw new Error(`File not found or inaccessible: ${filename}`);
          }

          return {
            filename: filename.split('/').pop()!, // Get just the filename for email attachment
            path: filePath // Full path for downloading
          };
        }));

        // Send the email using authenticated user's session
        const result = await EmailService.sendEmail(
          to,
          subject,
          body
        );

        if (!result) {
          throw new Error('Failed to send email');
        }

        // Record the job application
        const { error: dbError } = await supabase
          .from('job_applications')
          .insert({
            recruiter: to,
            job: subject,
            user_id: userId,
            status: 'sent',
            files: verifiedAttachments.map(att => att.filename)
          });

        if (dbError) {
          console.error('Error recording job application:', dbError);
        }

        return `Email sent successfully to ${to} with ${attachments.length} attachment(s)`;
      } catch (error: any) {
        console.error('Error sending email:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }
    },
  });

  // Helper function to determine MIME type
  function getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  return [listFiles, getFileUrl, sendEmailWithAttachment];
};

const createDatabaseTools = () => {
  const getRecruiter = new DynamicTool({
    name: "get_recruiter",
    description: "Get information about a call center recruiter by their email or ID (Read-only)",
    func: async (identifier: string) => {
      try {
        let query = supabase.from('call_center_recruiters').select();
        
        if (!isNaN(Number(identifier))) {
          query = query.eq('id', Number(identifier));
        } else {
          query = query.eq('email', identifier);
        }

        const { data, error } = await query.single();

        if (error) throw error;

        return JSON.stringify({
          success: true,
          data,
          message: 'Recruiter information retrieved successfully'
        });
      } catch (error: any) {
        return JSON.stringify({
          success: false,
          error: error.message
        });
      }
    }
  });

  const listRecruiters = new DynamicTool({
    name: "list_recruiters",
    description: "List all call center recruiters (Read-only)",
    func: async () => {
      try {
        const { data, error } = await supabase
          .from('call_center_recruiters')
          .select('*');

        if (error) throw error;

        return JSON.stringify({
          success: true,
          data,
          message: `Found ${data.length} recruiters`
        });
      } catch (error: any) {
        return JSON.stringify({
          success: false,
          error: error.message
        });
      }
    }
  });

  const searchRecruiters = new DynamicTool({
    name: "search_recruiters",
    description: "Search for recruiters by email pattern (Read-only)",
    func: async (emailPattern: string) => {
      try {
        const { data, error } = await supabase
          .from('call_center_recruiters')
          .select('*')
          .ilike('email', `%${emailPattern}%`);

        if (error) throw error;

        return JSON.stringify({
          success: true,
          data,
          message: `Found ${data.length} recruiters matching the pattern`
        });
      } catch (error: any) {
        return JSON.stringify({
          success: false,
          error: error.message
        });
      }
    }
  });

  return [getRecruiter, listRecruiters, searchRecruiters];
};

const AGENT_SYSTEM_TEMPLATE = `You are a helpful AI assistant that can handle various tasks including working with files, attachments, accessing recruiter information, and managing user documents.

You have access to the following capabilities:
- Viewing and managing files in the user's personal document folder
- Accessing document metadata and information
- Helping users understand their uploaded documents
- Listing all files in the CV bucket
- Getting public URLs for files
- Sending emails with attachments
- Getting recruiter information by email or ID
- Listing all recruiters
- Searching recruiters by email pattern

When users ask about their documents:
1. Check their personal folder in the 'cv' bucket
2. List available documents with details
3. Help them understand what documents they have
4. Guide them on document management

When a user wants to:
Send an email with attachments:
1. First use list_files to show available files
2. Confirm with the user which files they want to attach
3. Use send_email_with_attachment to compose and send the email

Access recruiter information:
1. Use appropriate database tools to fetch the requested information
2. Present the information in a clear, organized manner
3. Protect sensitive information and maintain privacy

Remember to:
- Always check the user's specific folder (users/<user_id>/)
- Be helpful and professional
- Maintain privacy and security
- Guide users if they need to upload new documents
- Always list available files before asking which ones to attach
- Confirm file selections with the user
- Format emails professionally
- Handle database queries securely
- Present recruiter information clearly and professionally

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
    ...createFileTools(userId),
    ...createDatabaseTools(),
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
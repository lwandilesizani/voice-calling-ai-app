"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, RefreshCw, Edit, Save, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AssistantConfig {
  id?: number;
  businessId?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  transcriptionLanguage: string;
  transcriptionModel: string;
  voiceProvider: string;
  voiceId: string;
  firstMessage: string;
  systemPrompt: string;
  isActive: boolean;
  assistantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VapiAssistantDetails {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  model: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  voice: {
    provider: string;
    voiceId: string;
  };
  transcriber: {
    provider: string;
    language: string;
    model: string;
  };
  firstMessage: string;
}

// Add a debug display component
const DebugDisplay = ({ data }: { data: any }) => {
  return (
    <div className="mt-8 p-4 border border-red-500 rounded-md bg-red-50">
      <h3 className="text-lg font-bold text-red-700 mb-2">Debug Information</h3>
      <pre className="text-xs overflow-auto max-h-[300px]">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default function MyAssistantsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [assistantDetails, setAssistantDetails] = useState<VapiAssistantDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState<AssistantConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activationComplete, setActivationComplete] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams ? searchParams.get('returnTo') : null;

  // Log the current state at render time
  console.log('Rendering MyAssistantsPage with config:', config);
  console.log('isActive:', config?.isActive);
  console.log('assistantId:', config?.assistantId);

  // Load the current configuration when the page loads
  useEffect(() => {
    const fetchAssistantConfig = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch('/api/vapi/assistant');
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error fetching assistant configuration:', errorData);
          throw new Error(errorData.error || 'Failed to fetch assistant configuration');
        }
        
        const rawData = await response.json();
        
        // If we have data, convert snake_case to camelCase
        if (Object.keys(rawData).length > 0) {
          const data = {
            id: rawData.id,
            businessId: rawData.business_id,
            model: rawData.model,
            temperature: rawData.temperature,
            maxTokens: rawData.max_tokens,
            transcriptionLanguage: rawData.transcription_language,
            transcriptionModel: rawData.transcription_model,
            voiceProvider: rawData.voice_provider,
            voiceId: rawData.voice_id,
            firstMessage: rawData.first_message,
            systemPrompt: rawData.system_prompt,
            isActive: rawData.is_active,
            assistantId: rawData.assistant_id,
            createdAt: rawData.created_at,
            updatedAt: rawData.updated_at
          };
          
          console.log('Loaded assistant configuration:', data);
          setConfig(data);
          
          // If the assistant is active and has an ID, fetch its details
          if (data.isActive && data.assistantId) {
            fetchAssistantDetails(data.assistantId);
          }
        } else {
          // If no configuration exists, create a default one
          const defaultConfig = {
            businessId: '', // This will be set by the server
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 300,
            transcriptionLanguage: 'en',
            transcriptionModel: 'Nova @ General',
            voiceProvider: 'Cartesia',
            voiceId: '248be419-c632-4f23-adf1-5324ed7dbf1d',
            firstMessage: 'Hi, this is Ava. How may I assist you today?',
            systemPrompt: `You are Ava, an AI assistant for a business. Be helpful, professional, and patient with customers. Use the available tools to provide accurate information about the business, its services, and handle bookings. Always use real business data from the database instead of making assumptions.

BOOKING PROCESS INSTRUCTIONS:

1. INFORMATION GATHERING:
   - Collect all required booking information (name, email, phone, date, time)
   - Verify each piece of information with the customer before proceeding

2. CONFIRMATION REQUIRED:
   - Before creating a booking, ALWAYS summarize all details and explicitly ask: "Would you like me to confirm this booking now?"
   - Only proceed with booking after receiving clear confirmation from the customer

3. AVOID DUPLICATE BOOKINGS:
   - Never create multiple bookings for the same customer in a single conversation
   - If a customer wants to change details, offer to update the existing booking instead of creating a new one

4. BOOKING CONTEXT MAINTENANCE:
   - After creating a booking, store the booking_id in your conversation context
   - Reference this booking_id when the customer wants to make changes

5. VERIFICATION AFTER BOOKING:
   - After creating a booking, confirm to the customer that the booking was successful
   - Inform them they will receive a confirmation email

6. MANAGING EXISTING BOOKINGS:
   - When customers ask about their existing bookings, use the get_customer_bookings tool to retrieve their booking information
   - Search by email first, then phone or name if email is not available
   - Present booking details clearly, including date, time, service, and status

7. UPDATING BOOKINGS:
   - Use the update_booking tool to modify existing bookings when customers request changes
   - Always confirm the booking_id before making any changes
   - Verify all changes with the customer before submitting the update
   - Confirm the update was successful and summarize the changes made`,
            isActive: false
          };
          
          console.log('No configuration found, using default:', defaultConfig);
          setConfig(defaultConfig);
        }
      } catch (error) {
        console.error('Error fetching assistant configuration:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load AI Assistant configuration",
          variant: "destructive",
        });
        
        // Set a default configuration on error
        setConfig({
          businessId: '', // This will be set by the server
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 300,
          transcriptionLanguage: 'en',
          transcriptionModel: 'Nova @ General',
          voiceProvider: 'Cartesia',
          voiceId: '248be419-c632-4f23-adf1-5324ed7dbf1d',
          firstMessage: 'Hi, this is Ava. How may I assist you today?',
          systemPrompt: `You are Ava, an AI assistant for a business. Be helpful, professional, and patient with customers. Use the available tools to provide accurate information about the business, its services, and handle bookings. Always use real business data from the database instead of making assumptions.

BOOKING PROCESS INSTRUCTIONS:

1. INFORMATION GATHERING:
   - Collect all required booking information (name, email, phone, date, time)
   - Verify each piece of information with the customer before proceeding

2. CONFIRMATION REQUIRED:
   - Before creating a booking, ALWAYS summarize all details and explicitly ask: "Would you like me to confirm this booking now?"
   - Only proceed with booking after receiving clear confirmation from the customer

3. AVOID DUPLICATE BOOKINGS:
   - Never create multiple bookings for the same customer in a single conversation
   - If a customer wants to change details, offer to update the existing booking instead of creating a new one

4. BOOKING CONTEXT MAINTENANCE:
   - After creating a booking, store the booking_id in your conversation context
   - Reference this booking_id when the customer wants to make changes

5. VERIFICATION AFTER BOOKING:
   - After creating a booking, confirm to the customer that the booking was successful
   - Inform them they will receive a confirmation email

6. MANAGING EXISTING BOOKINGS:
   - When customers ask about their existing bookings, use the get_customer_bookings tool to retrieve their booking information
   - Search by email first, then phone or name if email is not available
   - Present booking details clearly, including date, time, service, and status

7. UPDATING BOOKINGS:
   - Use the update_booking tool to modify existing bookings when customers request changes
   - Always confirm the booking_id before making any changes
   - Verify all changes with the customer before submitting the update
   - Confirm the update was successful and summarize the changes made`,
          isActive: false
        });
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchAssistantConfig();
  }, [toast]);

  const fetchAssistantDetails = async (assistantId: string) => {
    try {
      setIsRefreshing(true);
      console.log('Fetching assistant details from Vapi for ID:', assistantId);
      
      const response = await fetch(`/api/vapi/assistant/details?id=${assistantId}`);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching assistant details:', errorData);
        throw new Error(errorData.error || 'Failed to fetch assistant details');
      }
      
      const data = await response.json();
      console.log('Assistant details received:', data);
      setAssistantDetails(data);
      
      return data; // Return the data for chaining
    } catch (error) {
      console.error('Error fetching assistant details:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch assistant details",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add a useEffect to automatically fetch assistant details when the component mounts
  useEffect(() => {
    if (config?.isActive && config?.assistantId && !assistantDetails) {
      console.log('Auto-fetching assistant details for ID:', config.assistantId);
      fetchAssistantDetails(config.assistantId);
    }
  }, [config?.assistantId, config?.isActive, assistantDetails]);

  // Add a function to force refresh the page data
  const forceRefresh = async () => {
    setInitialLoading(true);
    try {
      // Reload the configuration
      const response = await fetch('/api/vapi/assistant');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load configuration');
      }
      
      const data = await response.json();
      
      // If we got data back, use it
      if (data && Object.keys(data).length > 0) {
        setConfig(data);
        
        // If the assistant is active and has an ID, fetch its details from Vapi
        if (data.isActive && data.assistantId) {
          await fetchAssistantDetails(data.assistantId);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  // Update the activateAssistant function
  const activateAssistant = async () => {
    setLoading(true);
    try {
      console.log('Activating assistant...');
      
      const response = await fetch('/api/vapi/assistant', {
        method: 'PUT',
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error data:', errorData);
        throw new Error(errorData.error || 'Failed to activate assistant');
      }
      
      const rawData = await response.json();
      console.log('Activation response:', rawData);
      
      if (!rawData.assistantId) {
        throw new Error('No assistant ID returned from the server');
      }
      
      // Force reload the page to show the updated UI
      window.location.reload();
      
      toast({
        title: "Success",
        description: "AI Assistant activated successfully!",
        variant: "success",
      });
      
      // Refresh the page to show the updated assistant
      setActivationComplete(true);
      
      // Redirect to returnTo URL if provided
      if (returnTo) {
        setTimeout(() => {
          router.push(decodeURIComponent(returnTo));
        }, 1500); // Short delay to allow the user to see the success message
      }
    } catch (error) {
      console.error('Error activating assistant:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate AI Assistant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setEditedConfig(config);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedConfig(null);
  };

  const handleInputChange = (field: keyof AssistantConfig, value: string | number | boolean) => {
    setEditedConfig(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleSaveChanges = async () => {
    if (!editedConfig) return;
    
    setIsSaving(true);
    try {
      console.log('Saving assistant configuration...', editedConfig);
      
      // Convert camelCase to snake_case for the API
      const apiConfig = {
        business_id: editedConfig.businessId,
        model: editedConfig.model,
        temperature: editedConfig.temperature,
        max_tokens: editedConfig.maxTokens,
        transcription_language: editedConfig.transcriptionLanguage,
        transcription_model: editedConfig.transcriptionModel,
        voice_provider: editedConfig.voiceProvider,
        voice_id: editedConfig.voiceId,
        first_message: editedConfig.firstMessage,
        system_prompt: editedConfig.systemPrompt,
        is_active: editedConfig.isActive,
        assistant_id: editedConfig.assistantId
      };
      
      console.log('Sending API config:', apiConfig);
      
      const response = await fetch('/api/vapi/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiConfig),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown error' };
        }
        console.error('Error saving configuration:', errorData, 'Status:', response.status);
        throw new Error(errorData.error || `Failed to save configuration: ${response.status}`);
      }
      
      const rawData = await response.json();
      console.log('Received response data:', rawData);
      
      if (!rawData || Object.keys(rawData).length === 0) {
        throw new Error('Received empty response from server');
      }
      
      // Convert snake_case to camelCase
      const data = {
        id: rawData.id,
        businessId: rawData.business_id,
        model: rawData.model,
        temperature: rawData.temperature,
        maxTokens: rawData.max_tokens,
        transcriptionLanguage: rawData.transcription_language,
        transcriptionModel: rawData.transcription_model,
        voiceProvider: rawData.voice_provider,
        voiceId: rawData.voice_id,
        firstMessage: rawData.first_message,
        systemPrompt: rawData.system_prompt,
        isActive: rawData.is_active,
        assistantId: rawData.assistant_id,
        createdAt: rawData.created_at,
        updatedAt: rawData.updated_at
      };
      
      setConfig(data);
      
      // If the assistant is active and has an ID, update it on Vapi
      if (data.isActive && data.assistantId) {
        try {
          await updateVapiAssistant(data);
          // Refresh the assistant details
          fetchAssistantDetails(data.assistantId);
        } catch (vapiError) {
          console.error('Error updating Vapi assistant:', vapiError);
          // Continue with the save process even if Vapi update fails
          toast({
            title: "Warning",
            description: "Configuration saved but failed to update the assistant on Vapi. Please try again.",
            variant: "destructive",
          });
          // Don't exit the function, continue with the success path
        }
      }
      
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "AI Assistant configuration saved successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save AI Assistant configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateVapiAssistant = async (config: AssistantConfig) => {
    try {
      console.log('Updating assistant on Vapi...', config.assistantId);
      
      if (!config.assistantId) {
        throw new Error('No assistant ID provided for update');
      }
      
      const response = await fetch(`/api/vapi/assistant/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: config.assistantId,
          config
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown error' };
        }
        console.error('Error updating assistant on Vapi:', errorData, 'Status:', response.status);
        throw new Error(errorData.error || `Failed to update assistant on Vapi: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Assistant updated on Vapi successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error updating assistant on Vapi:', error);
      throw error;
    }
  };

  const refreshAssistantDetails = () => {
    if (config?.assistantId) {
      console.log('Manually refreshing assistant details for ID:', config.assistantId);
      fetchAssistantDetails(config.assistantId);
    } else {
      toast({
        title: "Error",
        description: "No assistant ID found. Please activate an assistant first.",
        variant: "destructive",
      });
    }
  };

  // Add this function after the refreshAssistantDetails function
  const deactivateAssistant = async () => {
    if (!config?.assistantId) {
      toast({
        title: "Error",
        description: "No assistant ID found. Cannot deactivate.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      console.log('Deactivating assistant with ID:', config.assistantId);
      
      const response = await fetch(`/api/vapi/assistant/delete?id=${config.assistantId}`, {
        method: 'DELETE',
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error data:', errorData);
        throw new Error(errorData.error || 'Failed to deactivate assistant');
      }
      
      const data = await response.json();
      console.log('Deactivation response:', data);
      
      // Force reload the page to show the updated UI
      window.location.reload();
      
      toast({
        title: "Success",
        description: "AI Assistant deactivated successfully",
        variant: "success",
      });
    } catch (error) {
      console.error('Error deactivating assistant:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deactivate AI Assistant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add debugging to display the current state
  if (initialLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading AI Assistant configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Assistants</h1>
      
      {initialLoading ? (
        <div className="container mx-auto py-8 flex justify-center items-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading AI Assistant configuration...</p>
          </div>
        </div>
      ) : config?.isActive && config?.assistantId ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-500 text-white">Active</Badge>
              <span className="text-sm text-muted-foreground">ID: {config.assistantId}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshAssistantDetails}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              {!isEditing && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleEditClick}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={deactivateAssistant}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    )}
                    Deactivate
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit AI Assistant</CardTitle>
                <CardDescription>Update your AI assistant configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic">
                  <TabsList className="mb-4">
                    <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                    <TabsTrigger value="voice">Voice Settings</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Select 
                        value={editedConfig?.model} 
                        onValueChange={(value) => handleInputChange('model', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        min={0}
                        max={1}
                        step={0.1}
                        value={editedConfig?.temperature}
                        onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        min={1}
                        value={editedConfig?.maxTokens}
                        onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="firstMessage">First Message</Label>
                      <Textarea
                        id="firstMessage"
                        rows={3}
                        value={editedConfig?.firstMessage}
                        onChange={(e) => handleInputChange('firstMessage', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="systemPrompt">System Prompt</Label>
                      <Textarea
                        id="systemPrompt"
                        rows={4}
                        value={editedConfig?.systemPrompt}
                        onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="voice" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="voiceProvider">Voice Provider</Label>
                      <Select 
                        value={editedConfig?.voiceProvider} 
                        onValueChange={(value) => handleInputChange('voiceProvider', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select voice provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cartesia">Cartesia</SelectItem>
                          <SelectItem value="ElevenLabs">ElevenLabs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="voiceId">Voice ID</Label>
                      <Input
                        id="voiceId"
                        value={editedConfig?.voiceId}
                        onChange={(e) => handleInputChange('voiceId', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Current: Professional Woman (248be419-c632-4f23-adf1-5324ed7dbf1d)
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="advanced" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transcriptionLanguage">Transcription Language</Label>
                      <Select 
                        value={editedConfig?.transcriptionLanguage} 
                        onValueChange={(value) => handleInputChange('transcriptionLanguage', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="transcriptionModel">Transcription Model</Label>
                      <Select 
                        value={editedConfig?.transcriptionModel} 
                        onValueChange={(value) => handleInputChange('transcriptionModel', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nova @ General">Nova @ General</SelectItem>
                          <SelectItem value="Nova-2 @ General">Nova-2 @ General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Assistant Configuration</CardTitle>
                  <CardDescription>Your current assistant configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Basic Settings</h3>
                      <Separator className="my-2" />
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Model:</dt>
                          <dd className="text-sm font-medium">{config.model}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Temperature:</dt>
                          <dd className="text-sm font-medium">{config.temperature}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Max Tokens:</dt>
                          <dd className="text-sm font-medium">{config.maxTokens}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Voice Settings</h3>
                      <Separator className="my-2" />
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Voice Provider:</dt>
                          <dd className="text-sm font-medium">{config.voiceProvider}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Voice ID:</dt>
                          <dd className="text-sm font-medium truncate max-w-[200px]" title={config.voiceId}>
                            {config.voiceId}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Transcription Settings</h3>
                      <Separator className="my-2" />
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Language:</dt>
                          <dd className="text-sm font-medium">{config.transcriptionLanguage}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">Model:</dt>
                          <dd className="text-sm font-medium">{config.transcriptionModel}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium">Messages</h3>
                      <Separator className="my-2" />
                      <div className="space-y-2">
                        <div>
                          <dt className="text-sm text-muted-foreground">First Message:</dt>
                          <dd className="text-sm mt-1 p-2 bg-muted rounded-md">
                            {config.firstMessage}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground">System Prompt:</dt>
                          <dd className="text-sm mt-1 p-2 bg-muted rounded-md">
                            {config.systemPrompt}
                          </dd>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {assistantDetails ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Vapi Assistant Details</CardTitle>
                    <CardDescription>Information from Vapi API</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium">General Information</h3>
                        <Separator className="my-2" />
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Name:</dt>
                            <dd className="text-sm font-medium">{assistantDetails.name}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Created:</dt>
                            <dd className="text-sm font-medium">
                              {new Date(assistantDetails.createdAt).toLocaleString()}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Last Updated:</dt>
                            <dd className="text-sm font-medium">
                              {new Date(assistantDetails.updatedAt).toLocaleString()}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium">Model Information</h3>
                        <Separator className="my-2" />
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Provider:</dt>
                            <dd className="text-sm font-medium">{assistantDetails.model.provider}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Model:</dt>
                            <dd className="text-sm font-medium">{assistantDetails.model.model}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Temperature:</dt>
                            <dd className="text-sm font-medium">{assistantDetails.model.temperature}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Max Tokens:</dt>
                            <dd className="text-sm font-medium">{assistantDetails.model.maxTokens}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium">Voice Information</h3>
                        <Separator className="my-2" />
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Provider:</dt>
                            <dd className="text-sm font-medium">{assistantDetails.voice.provider}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Voice ID:</dt>
                            <dd className="text-sm font-medium truncate max-w-[200px]" title={assistantDetails.voice.voiceId}>
                              {assistantDetails.voice.voiceId}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium">Transcription Information</h3>
                        <Separator className="my-2" />
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Provider:</dt>
                            <dd className="text-sm font-medium">{assistantDetails.transcriber.provider}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Language:</dt>
                            <dd className="text-sm font-medium">{assistantDetails.transcriber.language}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm text-muted-foreground">Model:</dt>
                            <dd className="text-sm font-medium">{assistantDetails.transcriber.model}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Vapi Assistant Details</CardTitle>
                    <CardDescription>Information from Vapi API</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center py-8">
                    {isRefreshing ? (
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p>Loading assistant details...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-muted-foreground mb-4">
                          Assistant details not available. Click refresh to load.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={refreshAssistantDetails}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-card">
          <p className="text-center mb-6 text-muted-foreground">
            Activate your AI assistant to get started. This will create a dedicated AI assistant for your business.
          </p>
          <Button 
            size="lg" 
            className="px-8"
            onClick={activateAssistant}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activating...
              </>
            ) : (
              "Activate AI Assistant"
            )}
          </Button>
        </div>
      )}
      
      {/* Debug display */}
      <DebugDisplay data={{ config, isActive: config?.isActive, assistantId: config?.assistantId }} />
    </div>
  );
} 
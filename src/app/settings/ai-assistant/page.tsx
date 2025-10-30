'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, AlertTriangle } from "lucide-react"

interface AIAssistantConfig {
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
}

const DEFAULT_CONFIG: AIAssistantConfig = {
  model: "gpt-3.5-turbo",
  temperature: 0.7,
  maxTokens: 300,
  transcriptionLanguage: "en",
  transcriptionModel: "Nova @ General",
  voiceProvider: "Cartesia",
  voiceId: "248be419-c632-4f23-adf1-5324ed7dbf1d",
  firstMessage: "Hi, this is Ava. How may I assist you today?",
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
   - Inform them they will receive a confirmation email`,
  isActive: false
}

export default function AIAssistantPage() {
  const [config, setConfig] = useState<AIAssistantConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { toast } = useToast()

  // Load the current configuration when the page loads
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/vapi/assistant')
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to load configuration')
        }
        
        const data = await response.json()
        
        // If we got data back, use it, otherwise use the default config
        if (data && Object.keys(data).length > 0) {
          setConfig(data)
        } else {
          console.warn('Received empty configuration data, using defaults')
          setConfig(DEFAULT_CONFIG)
        }
      } catch (error) {
        console.error('Error loading configuration:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load AI Assistant configuration",
          variant: "destructive",
        })
        // Still use the default config if there's an error
        setConfig(DEFAULT_CONFIG)
      } finally {
        setInitialLoading(false)
      }
    }
    
    loadConfig()
  }, [toast])

  const handleInputChange = (field: keyof AIAssistantConfig, value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const saveConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/vapi/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save configuration')
      }
      
      toast({
        title: "Success",
        description: "AI Assistant configuration saved successfully",
        variant: "success",
      })
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save AI Assistant configuration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const activateAssistant = async () => {
    setActivating(true)
    try {
      const response = await fetch('/api/vapi/assistant', {
        method: 'PUT',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to activate assistant')
      }
      
      const data = await response.json()
      
      if (!data.assistantId) {
        throw new Error('No assistant ID returned from the server')
      }
      
      // Update the config with the new assistant ID
      setConfig(prev => ({
        ...prev,
        isActive: true,
        assistantId: data.assistantId
      }))
      
      toast({
        title: "Success",
        description: "AI Assistant activated successfully",
        variant: "success",
      })
    } catch (error) {
      console.error('Error activating assistant:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate AI Assistant",
        variant: "destructive",
      })
    } finally {
      setActivating(false)
    }
  }

  const deactivateAssistant = async () => {
    if (!config.assistantId) {
      toast({
        title: "Error",
        description: "No assistant ID found. Cannot deactivate.",
        variant: "destructive",
      })
      return
    }
    
    setActivating(true)
    try {
      const response = await fetch(`/api/vapi/assistant/delete?id=${config.assistantId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to deactivate assistant')
      }
      
      // Update the config with the new assistant ID
      setConfig(prev => ({
        ...prev,
        isActive: false,
        assistantId: undefined
      }))
      
      toast({
        title: "Success",
        description: "AI Assistant deactivated successfully",
        variant: "success",
      })
    } catch (error) {
      console.error('Error deactivating assistant:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deactivate AI Assistant",
        variant: "destructive",
      })
    } finally {
      setActivating(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading AI Assistant configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">AI Assistant Configuration</h1>
      
      <Tabs defaultValue="basic">
        <TabsList className="mb-4">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="voice">Voice Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>Basic Configuration</CardTitle>
              <CardDescription>Configure the basic settings for your AI assistant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select 
                  value={config.model} 
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
                  value={config.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min={1}
                  value={config.maxTokens}
                  onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firstMessage">First Message</Label>
                <Input
                  id="firstMessage"
                  value={config.firstMessage}
                  onChange={(e) => handleInputChange('firstMessage', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  rows={4}
                  value={config.systemPrompt}
                  onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the system prompt that guides the AI assistant's behavior.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Voice Configuration</CardTitle>
              <CardDescription>Configure the voice settings for your AI assistant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="transcriptionLanguage">Transcription Language</Label>
                <Select 
                  value={config.transcriptionLanguage} 
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
                  value={config.transcriptionModel} 
                  onValueChange={(value) => handleInputChange('transcriptionModel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nova @ General">Nova @ General</SelectItem>
                    <SelectItem value="Nova-2">Nova-2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voiceProvider">Voice Provider</Label>
                <Select 
                  value={config.voiceProvider} 
                  onValueChange={(value) => handleInputChange('voiceProvider', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cartesia">Cartesia</SelectItem>
                    <SelectItem value="ElevenLabs">ElevenLabs</SelectItem>
                    <SelectItem value="PlayHT">PlayHT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voiceId">Voice</Label>
                <Select 
                  value={config.voiceId} 
                  onValueChange={(value) => handleInputChange('voiceId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="248be419-c632-4f23-adf1-5324ed7dbf1d">Professional Woman</SelectItem>
                    <SelectItem value="other-voice-id-1">Professional Man</SelectItem>
                    <SelectItem value="other-voice-id-2">Casual Woman</SelectItem>
                    <SelectItem value="other-voice-id-3">Casual Man</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
              <CardDescription>Configure advanced settings for your AI assistant.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">AI Assistant Active</Label>
                  <Switch
                    id="isActive"
                    checked={config.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                    disabled={true}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {config.isActive 
                    ? `Assistant is active (ID: ${config.assistantId})` 
                    : "Assistant is not active. Click 'Activate Assistant' to deploy."}
                </p>
              </div>
              
              {config.assistantId && (
                <div className="space-y-2">
                  <Label htmlFor="assistantId">Assistant ID</Label>
                  <Input
                    id="assistantId"
                    value={config.assistantId}
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This ID is used to connect to your AI assistant in the Vapi platform.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 flex gap-4">
        <Button 
          onClick={saveConfig}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : 'Save Configuration'}
        </Button>
        
        {config.isActive ? (
          <Button 
            onClick={deactivateAssistant}
            disabled={activating}
            variant="destructive"
            className="flex-1"
          >
            {activating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deactivating...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Deactivate Assistant
              </>
            )}
          </Button>
        ) : (
          <Button 
            onClick={activateAssistant}
            disabled={activating}
            variant="default"
            className="flex-1"
          >
            {activating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Activating...
              </>
            ) : 'Activate Assistant'}
          </Button>
        )}
      </div>
    </div>
  )
} 
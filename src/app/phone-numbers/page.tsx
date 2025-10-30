"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash, Edit, Phone, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/lib/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PhoneNumber {
  id: number;
  business_id: string;
  vapi_phone_id: string;
  provider: string;
  name?: string;
  sip_uri?: string;
  assistant_id?: string;
  created_at?: string;
  updated_at?: string;
  number?: string;
  status?: string;
}

interface Assistant {
  id: number;
  assistantId: string;
  name: string;
}

export default function PhoneNumbersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams ? searchParams.get('returnTo') : null;
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  
  // Form state
  const [newPhoneNumber, setNewPhoneNumber] = useState({
    provider: "vapi",
    name: "",
    assistant_id: "none",
    phoneNumber: "",
    twilioAccountSid: "",
    twilioAuthToken: "",
    numberDesiredAreaCode: ""
  });
  
  // Add state for area code suggestions
  const [areaSuggestions, setAreaSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Add state for admin contact modal
  const [showAdminContactModal, setShowAdminContactModal] = useState(false);
  
  // Fetch phone numbers
  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vapi/phone-numbers');
      
      if (!response.ok) {
        throw new Error('Failed to fetch phone numbers');
      }
      
      const data = await response.json();
      setPhoneNumbers(data);
    } catch (error) {
      console.error('Error fetching phone numbers:', error);
      toast({
        title: "Error",
        description: "Failed to load phone numbers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch assistants
  const fetchAssistants = async () => {
    try {
      const response = await fetch('/api/vapi/assistants');
      
      if (!response.ok) {
        throw new Error('Failed to fetch assistants');
      }
      
      const data = await response.json();
      setAssistants(data);
    } catch (error) {
      console.error('Error fetching assistants:', error);
      toast({
        title: "Error",
        description: "Failed to load assistants",
        variant: "destructive",
      });
      
      // Fallback to mock data if API fails
      setAssistants([
        { id: 1, assistantId: "asst_123", name: "Customer Support Assistant" },
        { id: 2, assistantId: "asst_456", name: "Sales Assistant" }
      ]);
    }
  };
  
  // Create a new phone number
  const createPhoneNumber = async () => {
    try {
      setIsCreating(true);
      setErrorMessage(null);
      setShowSuggestions(false);
      setAreaSuggestions([]);
      
      // Validate required fields
      if (!newPhoneNumber.provider) {
        throw new Error('Provider is required');
      }
      
      if (!newPhoneNumber.name || newPhoneNumber.name.trim() === '') {
        throw new Error('Name is required');
      }
      
      // Prepare data to send to the API
      const dataToSend: any = {
        provider: newPhoneNumber.provider,
        name: newPhoneNumber.name.trim(),
      };
      
      // Add assistant ID if selected
      if (newPhoneNumber.assistant_id && newPhoneNumber.assistant_id !== 'none') {
        dataToSend.assistant_id = newPhoneNumber.assistant_id;
      }
      
      // Handle different providers
      if (newPhoneNumber.provider === 'vapi') {
        // For Vapi provider, we don't need to specify a number
        // The API will provision a number for us
        
        // Optionally, if you want to specify an area code for the US number
        if (newPhoneNumber.numberDesiredAreaCode && newPhoneNumber.numberDesiredAreaCode.trim()) {
          dataToSend.numberDesiredAreaCode = newPhoneNumber.numberDesiredAreaCode.trim();
        }
      } 
      else if (newPhoneNumber.provider === 'twilio') {
        // For Twilio provider, we need to provide the Twilio credentials
        if (newPhoneNumber.twilioAccountSid) {
          dataToSend.twilioAccountSid = newPhoneNumber.twilioAccountSid;
        }
        if (newPhoneNumber.twilioAuthToken) {
          dataToSend.twilioAuthToken = newPhoneNumber.twilioAuthToken;
        }
        // If a specific number is provided
        if (newPhoneNumber.phoneNumber) {
          dataToSend.number = newPhoneNumber.phoneNumber;
        }
      } 
      else if (newPhoneNumber.provider === 'byo-phone-number') {
        // For BYO phone number, we need to provide the actual number in E.164 format
        if (newPhoneNumber.phoneNumber) {
          // Ensure number is in E.164 format (e.g., +12345678901)
          let formattedNumber = newPhoneNumber.phoneNumber;
          if (!formattedNumber.startsWith('+')) {
            formattedNumber = `+${formattedNumber}`;
          }
          dataToSend.number = formattedNumber;
        }
      }
      
      console.log('Sending phone number data:', dataToSend);
      
      const response = await fetch('/api/vapi/phone-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown error' };
        }
        console.error('Error creating phone number:', errorData);
        
        // Check if this is a one-phone-per-business error
        if (errorData.code === 'ONE_PHONE_PER_BUSINESS') {
          setShowAdminContactModal(true);
          setIsCreating(false);
          return;
        }
        
        // Check if this is an area code unavailable error with suggestions
        if (errorData.error === 'Area code unavailable') {
          // Set the error message
          setErrorMessage(errorData.message || 'The area code you selected is not available.');
          
          // Extract suggested area codes if available in the response
          const suggestedCodes = errorData.suggestedAreaCodes || [];
          
          if (suggestedCodes.length > 0) {
            setAreaSuggestions(suggestedCodes);
            setShowSuggestions(true);
          } else {
            // If no suggestions, show a more helpful message
            setErrorMessage(
              'The area code you selected is not available. Please try a different area code or leave it blank to get any available number.'
            );
          }
          
          setIsCreating(false);
          return;
        }
        
        // Handle specific error about phone number format
        if (errorData.error && errorData.error.includes('A phone number must either be a string or an object of shape')) {
          throw new Error('Invalid phone number format. Please provide a valid phone number in E.164 format (e.g., +12345678901).');
        }
        
        throw new Error(errorData.error || errorData.message || `Failed to create phone number: ${response.status}`);
      }
      
      const data = await response.json();
      setPhoneNumbers([data, ...phoneNumbers]);
      
      toast({
        title: "Success",
        description: "Phone number created successfully",
        variant: "default",
      });
      
      // Clear form and close dialog
      setNewPhoneNumber({
        provider: "vapi",
        name: "",
        assistant_id: "none",
        phoneNumber: "",
        twilioAccountSid: "",
        twilioAuthToken: "",
        numberDesiredAreaCode: ""
      });
      setIsCreating(false);
      
      // Refresh the phone numbers list
      fetchPhoneNumbers();
      
      // Redirect to returnTo URL if provided
      if (returnTo) {
        router.push(decodeURIComponent(returnTo));
      }
      setErrorMessage(null);
    } catch (error) {
      console.error('Error creating phone number:', error);
      setErrorMessage(error instanceof Error ? error.message : "Failed to create phone number");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create phone number",
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };
  
  // Update a phone number
  const updatePhoneNumber = async (id: number, data: any) => {
    try {
      const response = await fetch(`/api/vapi/phone-numbers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update phone number');
      }
      
      const updatedPhoneNumber = await response.json();
      
      // Update the phone numbers list
      setPhoneNumbers(phoneNumbers.map(phone => 
        phone.id === id ? updatedPhoneNumber : phone
      ));
      
      toast({
        title: "Success",
        description: "Phone number updated successfully",
        variant: "default",
      });
      
      setIsEditing(null);
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update phone number",
        variant: "destructive",
      });
    }
  };
  
  // Delete a phone number
  const deletePhoneNumber = async (id: number) => {
    try {
      const response = await fetch(`/api/vapi/phone-numbers/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete phone number');
      }
      
      // Remove the phone number from the list
      setPhoneNumbers(phoneNumbers.filter(phone => phone.id !== id));
      
      toast({
        title: "Success",
        description: "Phone number deleted successfully",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting phone number:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete phone number",
        variant: "destructive",
      });
    }
  };
  
  // Add a function to handle selecting a suggested area code
  const handleSelectAreaCode = (areaCode: string) => {
    setNewPhoneNumber({
      ...newPhoneNumber,
      numberDesiredAreaCode: areaCode
    });
    setShowSuggestions(false);
    // Automatically try to create the phone number with the new area code
    setTimeout(() => {
      createPhoneNumber();
    }, 100);
  };
  
  // Load data on mount
  useEffect(() => {
    fetchPhoneNumbers();
    fetchAssistants();
  }, []);
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Phone Numbers</h1>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={fetchPhoneNumbers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Phone Number
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Phone Number</DialogTitle>
                <DialogDescription>
                  Create a new phone number and optionally assign it to an assistant.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="provider-empty">Provider</Label>
                  <Select 
                    value={newPhoneNumber.provider}
                    onValueChange={(value) => setNewPhoneNumber({...newPhoneNumber, provider: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vapi">Vapi</SelectItem>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="byo-phone-number">BYO Phone Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name-empty">Name</Label>
                  <Input 
                    id="name-empty" 
                    placeholder="My Business Phone" 
                    value={newPhoneNumber.name}
                    onChange={(e) => setNewPhoneNumber({...newPhoneNumber, name: e.target.value})}
                  />
                </div>
                
                {newPhoneNumber.provider === 'byo-phone-number' ? (
                  <div className="space-y-2">
                    <Label htmlFor="phone-number-empty">Phone Number</Label>
                    <Input 
                      id="phone-number-empty" 
                      placeholder="+12345678901" 
                      value={newPhoneNumber.phoneNumber}
                      onChange={(e) => setNewPhoneNumber({...newPhoneNumber, phoneNumber: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">Enter the full phone number with country code (e.g., +12345678901)</p>
                  </div>
                ) : newPhoneNumber.provider === 'twilio' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="twilio-account-sid">Twilio Account SID</Label>
                      <Input 
                        id="twilio-account-sid" 
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                        value={newPhoneNumber.twilioAccountSid}
                        onChange={(e) => setNewPhoneNumber({...newPhoneNumber, twilioAccountSid: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilio-auth-token">Twilio Auth Token</Label>
                      <Input 
                        id="twilio-auth-token" 
                        placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                        value={newPhoneNumber.twilioAuthToken}
                        onChange={(e) => setNewPhoneNumber({...newPhoneNumber, twilioAuthToken: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="twilio-phone-number">Phone Number (Optional)</Label>
                      <Input 
                        id="twilio-phone-number" 
                        placeholder="+12345678901" 
                        value={newPhoneNumber.phoneNumber}
                        onChange={(e) => setNewPhoneNumber({...newPhoneNumber, phoneNumber: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">If left empty, Twilio will provision a number for you</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="areaCode">Area Code (Optional)</Label>
                    <Input
                      id="areaCode"
                      placeholder="e.g., 415"
                      value={newPhoneNumber.numberDesiredAreaCode || ''}
                      onChange={(e) => setNewPhoneNumber({
                        ...newPhoneNumber,
                        numberDesiredAreaCode: e.target.value
                      })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Vapi will automatically provision a US phone number. You can optionally specify a desired area code.
                    </p>
                    
                    {errorMessage && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    )}
                    
                    {showSuggestions && areaSuggestions.length > 0 && (
                      <div className="mt-4 p-4 border rounded-md bg-muted">
                        <h3 className="font-medium mb-2">Suggested Available Area Codes:</h3>
                        <div className="flex flex-wrap gap-2">
                          {areaSuggestions.map((areaCode) => (
                            <Button
                              key={areaCode}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectAreaCode(areaCode)}
                            >
                              {areaCode}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="assistant-empty">Assistant (Optional)</Label>
                  <Select 
                    value={newPhoneNumber.assistant_id}
                    onValueChange={(value) => setNewPhoneNumber({...newPhoneNumber, assistant_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assistant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {assistants.map((assistant) => (
                        <SelectItem key={assistant.assistantId} value={assistant.assistantId}>
                          {assistant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  // Close the dialog
                  const dialogTrigger = document.querySelector('[data-state="open"]');
                  if (dialogTrigger) {
                    (dialogTrigger as HTMLButtonElement).click();
                  }
                  
                  // Reset form
                  setNewPhoneNumber({
                    provider: "vapi",
                    name: "",
                    assistant_id: "none",
                    phoneNumber: "",
                    twilioAccountSid: "",
                    twilioAuthToken: "",
                    numberDesiredAreaCode: ""
                  });
                  setErrorMessage(null);
                  setShowSuggestions(false);
                  setAreaSuggestions([]);
                }}>
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={createPhoneNumber} 
                  disabled={isCreating || !newPhoneNumber.name || (errorMessage !== null && !showSuggestions)}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Admin Contact Modal */}
      <Dialog open={showAdminContactModal} onOpenChange={setShowAdminContactModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Multiple Phone Numbers Not Allowed</DialogTitle>
            <DialogDescription>
              Each business is limited to one phone number. To request additional phone numbers, please contact our admin team.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Contact Information</AlertTitle>
              <AlertDescription>
                Please email <span className="font-medium">admin@wecallsmart.com</span> with your business details and reason for needing additional phone numbers.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAdminContactModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : phoneNumbers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Phone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No Phone Numbers</p>
            <p className="text-muted-foreground mb-4">You haven't added any phone numbers yet.</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Phone Number
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Phone Number</DialogTitle>
                  <DialogDescription>
                    Create a new phone number and optionally assign it to an assistant.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider-empty2">Provider</Label>
                    <Select 
                      value={newPhoneNumber.provider}
                      onValueChange={(value) => setNewPhoneNumber({...newPhoneNumber, provider: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vapi">Vapi</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="byo-phone-number">BYO Phone Number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name-empty2">Name</Label>
                    <Input 
                      id="name-empty2" 
                      placeholder="My Business Phone" 
                      value={newPhoneNumber.name}
                      onChange={(e) => setNewPhoneNumber({...newPhoneNumber, name: e.target.value})}
                    />
                  </div>
                  
                  {newPhoneNumber.provider === 'byo-phone-number' ? (
                    <div className="space-y-2">
                      <Label htmlFor="phone-number-empty2">Phone Number</Label>
                      <Input 
                        id="phone-number-empty2" 
                        placeholder="+12345678901" 
                        value={newPhoneNumber.phoneNumber}
                        onChange={(e) => setNewPhoneNumber({...newPhoneNumber, phoneNumber: e.target.value})}
                      />
                      <p className="text-xs text-muted-foreground">Enter the full phone number with country code (e.g., +12345678901)</p>
                    </div>
                  ) : newPhoneNumber.provider === 'twilio' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="twilio-account-sid2">Twilio Account SID</Label>
                        <Input 
                          id="twilio-account-sid2" 
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                          value={newPhoneNumber.twilioAccountSid}
                          onChange={(e) => setNewPhoneNumber({...newPhoneNumber, twilioAccountSid: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twilio-auth-token2">Twilio Auth Token</Label>
                        <Input 
                          id="twilio-auth-token2" 
                          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                          value={newPhoneNumber.twilioAuthToken}
                          onChange={(e) => setNewPhoneNumber({...newPhoneNumber, twilioAuthToken: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="twilio-phone-number2">Phone Number (Optional)</Label>
                        <Input 
                          id="twilio-phone-number2" 
                          placeholder="+12345678901" 
                          value={newPhoneNumber.phoneNumber}
                          onChange={(e) => setNewPhoneNumber({...newPhoneNumber, phoneNumber: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground">If left empty, Twilio will provision a number for you</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="areaCode2">Area Code (Optional)</Label>
                      <Input
                        id="areaCode2"
                        placeholder="e.g., 415"
                        value={newPhoneNumber.numberDesiredAreaCode || ''}
                        onChange={(e) => setNewPhoneNumber({
                          ...newPhoneNumber,
                          numberDesiredAreaCode: e.target.value
                        })}
                      />
                      <p className="text-sm text-muted-foreground">
                        Vapi will automatically provision a US phone number. You can optionally specify a desired area code.
                      </p>
                      
                      {errorMessage && (
                        <Alert variant="destructive" className="mt-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Error</AlertTitle>
                          <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                      )}
                      
                      {showSuggestions && areaSuggestions.length > 0 && (
                        <div className="mt-4 p-4 border rounded-md bg-muted">
                          <h3 className="font-medium mb-2">Suggested Available Area Codes:</h3>
                          <div className="flex flex-wrap gap-2">
                            {areaSuggestions.map((areaCode) => (
                              <Button
                                key={areaCode}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSelectAreaCode(areaCode)}
                              >
                                {areaCode}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="assistant-empty2">Assistant (Optional)</Label>
                    <Select 
                      value={newPhoneNumber.assistant_id}
                      onValueChange={(value) => setNewPhoneNumber({...newPhoneNumber, assistant_id: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assistant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {assistants.map((assistant) => (
                          <SelectItem key={assistant.assistantId} value={assistant.assistantId}>
                            {assistant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setNewPhoneNumber({
                      provider: "vapi",
                      name: "",
                      assistant_id: "none",
                      phoneNumber: "",
                      twilioAccountSid: "",
                      twilioAuthToken: "",
                      numberDesiredAreaCode: ""
                    });
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={createPhoneNumber} disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {phoneNumbers.map((phone) => (
            <Card key={phone.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{phone.name || "Unnamed Phone"}</CardTitle>
                    <CardDescription>
                      {phone.number || (phone.sip_uri ? "SIP Phone" : "No Phone Number")}
                    </CardDescription>
                  </div>
                  <Badge variant={phone.assistant_id ? 'default' : 'secondary'}>
                    {phone.assistant_id ? 'Assigned' : 'Unassigned'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Provider:</span>
                    <span className="text-sm font-medium">{phone.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Phone Number:</span>
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {phone.number || "Not available"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Assistant:</span>
                    <span className="text-sm font-medium">
                      {phone.assistant_id ? 
                        assistants.find(a => a.assistantId === phone.assistant_id)?.name || phone.assistant_id : 
                        "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <span className="text-sm font-medium">
                      {phone.status || "Active"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(phone.id)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => deletePhoneNumber(phone.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
              
              {isEditing === phone.id && (
                <Dialog open={true} onOpenChange={() => setIsEditing(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Phone Number</DialogTitle>
                      <DialogDescription>
                        Update the phone number details.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input 
                          id="edit-name" 
                          defaultValue={phone.name || ""}
                          onChange={(e) => phone.name = e.target.value}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-assistant">Assistant</Label>
                        <Select 
                          defaultValue={phone.assistant_id || "none"}
                          onValueChange={(value) => phone.assistant_id = value === "none" ? "" : value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select assistant" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {assistants.map((assistant) => (
                              <SelectItem key={assistant.assistantId} value={assistant.assistantId}>
                                {assistant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditing(null)}>
                        Cancel
                      </Button>
                      <Button onClick={() => updatePhoneNumber(phone.id, {
                        name: phone.name,
                        assistant_id: phone.assistant_id
                      })}>
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 
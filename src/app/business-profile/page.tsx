"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Clock } from "lucide-react";
import type { BusinessProfile } from "@/lib/supabase/types";

export default function BusinessProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<Partial<BusinessProfile>>({
    business_name: "",
    business_type: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams ? searchParams.get("returnTo") : null;
  const { toast } = useToast();
  const [timezones, setTimezones] = useState<string[]>([
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "America/Honolulu",
    "America/Puerto_Rico",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Dubai",
    "Australia/Sydney",
    "Pacific/Auckland",
    "Africa/Johannesburg",
    "Africa/Cairo"
  ]);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error(userError?.message || "User not found");
        }
        
        setUserId(user.id);
        
        // Check if business profile exists
        const { data: profiles, error: profileError } = await supabase
          .from("business_profiles")
          .select("*")
          .eq("user_id", user.id)
          .limit(1);
          
        if (profileError) {
          throw profileError;
        }
        
        // If profile exists, load it
        if (profiles && profiles.length > 0) {
          setBusinessProfile(profiles[0]);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndProfile();
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBusinessProfile((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (value: string, name: string) => {
    setBusinessProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      const profileData = {
        ...businessProfile,
        user_id: userId,
        updated_at: new Date().toISOString(),
      };
      
      // Check if profile exists
      const { data: existingProfiles, error: checkError } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("user_id", userId)
        .limit(1);
        
      if (checkError) {
        throw checkError;
      }
      
      let result;
      
      if (existingProfiles && existingProfiles.length > 0) {
        // Update existing profile
        result = await supabase
          .from("business_profiles")
          .update(profileData)
          .eq("id", existingProfiles[0].id);
      } else {
        // Create new profile
        result = await supabase
          .from("business_profiles")
          .insert([{ ...profileData, created_at: new Date().toISOString() }]);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Success",
        description: "Business profile updated successfully",
      });
      
      // Redirect to returnTo URL if provided
      if (returnTo) {
        router.push(decodeURIComponent(returnTo));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-6">Business Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Update your business details to help customers find and connect with you.
            {returnTo && (
              <p className="mt-2 text-sm text-amber-600">
                Complete your business profile to continue to your requested page.
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  name="business_name"
                  value={businessProfile.business_name || ""}
                  onChange={handleChange}
                  required
                  placeholder="Your Business Name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="business_type">Business Type *</Label>
                <Select
                  value={businessProfile.business_type || ""}
                  onValueChange={(value) => handleSelectChange(value, "business_type")}
                  required
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salon">Salon</SelectItem>
                    <SelectItem value="Restaurant">Restaurant</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Professional Services">Professional Services</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="email">Business Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={businessProfile.email || ""}
                  onChange={handleChange}
                  required
                  placeholder="business@example.com"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Business Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={businessProfile.phone || ""}
                  onChange={handleChange}
                  placeholder="(123) 456-7890"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={businessProfile.address || ""}
                  onChange={handleChange}
                  placeholder="123 Business St"
                  className="mt-1"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={businessProfile.city || ""}
                    onChange={handleChange}
                    placeholder="City"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={businessProfile.state || ""}
                    onChange={handleChange}
                    placeholder="State"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={businessProfile.zip_code || ""}
                    onChange={handleChange}
                    placeholder="ZIP Code"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={businessProfile.timezone || "America/New_York"}
                  onValueChange={(value) => handleSelectChange(value, "timezone")}
                >
                  <SelectTrigger id="timezone" className="mt-1">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>
                        {timezone.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  This timezone will be used for all your service availability and bookings.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-6">
        <Button variant="outline" onClick={() => router.push('/business-hours')} className="flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          Manage Business Hours
        </Button>
      </div>
    </div>
  );
} 
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, Circle, Loader2, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'

type OnboardingStep = {
  id: string
  title: string
  description: string
  completed: boolean
  path: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const initialLoadDone = useRef(false)
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'business-profile',
      title: 'Business Profile',
      description: 'Set up your business information',
      completed: false,
      path: '/business-profile?returnTo=/onboarding'
    },
    {
      id: 'business-hours',
      title: 'Business Hours',
      description: 'Configure your operating hours',
      completed: false,
      path: '/business-hours?returnTo=/onboarding'
    },
    {
      id: 'services',
      title: 'Services',
      description: 'Add services that you offer',
      completed: false,
      path: '/services?returnTo=/onboarding'
    },
    {
      id: 'phone-numbers',
      title: 'Phone Number',
      description: 'Get a phone number for your business',
      completed: false,
      path: '/phone-numbers?returnTo=/onboarding'
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Activate your AI Assistant',
      completed: false,
      path: '/my-assistants?returnTo=/onboarding'
    }
  ])
  
  // Calculate progress percentage
  const progress = steps.filter(step => step.completed).length / steps.length * 100

  useEffect(() => {
    // Skip if we've already loaded once
    if (initialLoadDone.current) return;
    
    const checkOnboardingStatus = async () => {
      try {
        setLoading(true)
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          toast({
            title: 'Authentication Error',
            description: 'Please log in to continue',
            variant: 'destructive'
          })
          router.push('/login')
          return
        }
        
        setUserId(user.id)
        
        // Check if business profile exists and is complete
        const { data: profiles, error: profileError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)
          
        if (profileError) {
          throw profileError
        }
        
        // Update step completion status
        const updatedSteps = [...steps]
        
        // Check if business profile is complete
        if (profiles && profiles.length > 0) {
          const profile = profiles[0]
          // Consider profile complete if required fields are filled
          const isProfileComplete = !!profile.business_name && 
                                   !!profile.business_type && 
                                   !!profile.email
          
          updatedSteps[0].completed = isProfileComplete
          
          // If business profile exists, check if business hours are configured
          if (isProfileComplete) {
            const { data: businessHours, error: businessHoursError } = await supabase
              .from('business_hours')
              .select('*')
              .eq('business_id', profile.id)
            
            if (!businessHoursError && businessHours && businessHours.length > 0) {
              // If at least one day is configured, consider business hours complete
              updatedSteps[1].completed = true
            }
            
            // Check if services are configured
            const { data: services, error: servicesError } = await supabase
              .from('services')
              .select('*')
              .eq('business_id', profile.id)
            
            if (!servicesError && services && services.length > 0) {
              // If at least one service is configured, consider services complete
              updatedSteps[2].completed = true
            }
            
            // Check if phone numbers are configured
            const { data: phoneNumbers, error: phoneNumbersError } = await supabase
              .from('phone_numbers')
              .select('*')
              .eq('business_id', profile.id)
            
            if (!phoneNumbersError && phoneNumbers && phoneNumbers.length > 0) {
              // If at least one phone number is configured, consider phone numbers complete
              updatedSteps[3].completed = true
            }
            
            // Check if AI Assistant is activated
            const { data: assistantConfigs, error: assistantConfigsError } = await supabase
              .from('assistant_configs')
              .select('*')
              .eq('business_id', profile.id)
              .eq('is_active', true)
            
            if (!assistantConfigsError && assistantConfigs && assistantConfigs.length > 0) {
              // If assistant is activated, consider AI Assistant complete
              updatedSteps[4].completed = true
            } else {
              // Also check the assistants table as a fallback
              const { data: assistants, error: assistantsError } = await supabase
                .from('assistants')
                .select('*')
                .eq('business_profile_id', profile.id)
              
              if (!assistantsError && assistants && assistants.length > 0) {
                // If at least one assistant exists, consider AI Assistant complete
                updatedSteps[4].completed = true
              }
            }
          }
        }
        
        setSteps(updatedSteps)
        // Mark that we've completed the initial load
        initialLoadDone.current = true;
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to check onboarding status',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }
    
    checkOnboardingStatus()
  }, [toast, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const allStepsCompleted = steps.every(step => step.completed)

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Onboarding</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Welcome to iServ AI</CardTitle>
          <CardDescription>
            Complete the following steps to set up your business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Onboarding Progress</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="border rounded-lg p-4">
                <div className="flex items-start">
                  <div className="mr-4 mt-1">
                    {step.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-1">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    
                    {step.completed ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={step.path}>Edit</Link>
                      </Button>
                    ) : (
                      <Button size="sm" asChild>
                        <Link href={step.path}>
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {allStepsCompleted && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <h3 className="text-lg font-medium mb-1">All set! Your business is ready.</h3>
                <p className="text-muted-foreground mb-4">You've completed all the required steps.</p>
                <Button onClick={() => router.push('/')}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

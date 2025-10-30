'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

// Define the form schema
const formSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  description: z.string().optional(),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute'),
  category: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function NewServicePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams ? searchParams.get('returnTo') : null

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: 0,
      description: '',
      duration: 60,
      category: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      // Don't redirect if user is not authenticated - middleware will handle this
      if (userError) {
        console.error('Error fetching user:', userError)
        setIsSubmitting(false)
        return
      }
      
      if (!user) {
        setIsSubmitting(false)
        return
      }
      
      // Get the user's business profile
      const { data: businessProfile, error: businessError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (businessError || !businessProfile) {
        console.error('Error fetching business profile:', businessError)
        alert('Failed to load business profile')
        setIsSubmitting(false)
        return
      }
      
      // Create the service
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .insert({
          business_id: businessProfile.id,
          name: values.name,
          price: values.price,
          description: values.description || null,
          duration: values.duration,
          category: values.category || null,
          custom_duration: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (serviceError) {
        console.error('Error creating service:', serviceError)
        alert('Failed to create service')
        setIsSubmitting(false)
        return
      }
      
      alert('Service created successfully')
      
      // Redirect to returnTo URL if provided, otherwise go to services page
      if (returnTo) {
        router.push(decodeURIComponent(returnTo))
      } else {
        router.push('/services')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-6">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => router.push('/services')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
      </Button>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Service</CardTitle>
          <CardDescription>
            Add a new service that clients can book appointments for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Haircut, Consultation, Massage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Hair, Spa, Consulting" {...field} />
                    </FormControl>
                    <FormDescription>
                      Categorize your service to help organize your offerings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this service includes..." 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => router.push('/services')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Service
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 
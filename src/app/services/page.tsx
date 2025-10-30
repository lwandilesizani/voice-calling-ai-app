'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Clock, DollarSign, Tag, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

// Define the Service type based on our database schema
type Service = {
  id: string
  name: string
  price: number
  description: string | null
  duration: number
  category: string | null
  custom_duration: boolean | null
  created_at: string | null
  updated_at: string | null
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams ? searchParams.get('returnTo') : null

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true)
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        // Don't redirect if user is not authenticated - middleware will handle this
        if (userError) {
          console.error('Error fetching user:', userError)
          setLoading(false)
          return
        }
        
        if (!user) {
          setLoading(false)
          return
        }
        
        // Get the user's business profile
        const { data: businessProfiles, error: businessError } = await supabase
          .from('business_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (businessError || !businessProfiles) {
          console.error('Error fetching business profile:', businessError)
          alert('Failed to load business profile')
          setLoading(false)
          return
        }
        
        // Get the services for this business
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('business_id', businessProfiles.id)
          .order('created_at', { ascending: false })
        
        if (servicesError) {
          console.error('Error fetching services:', servicesError)
          alert('Failed to load services')
        } else {
          setServices(servicesData || [])
        }
      } catch (error) {
        console.error('Error:', error)
        alert('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchServices()
  }, [router])

  const handleCreateService = () => {
    // Pass returnTo parameter if it exists
    if (returnTo) {
      router.push(`/services/new?returnTo=${encodeURIComponent(returnTo)}`)
    } else {
      router.push('/services/new')
    }
  }

  const handleEditService = (id: string) => {
    router.push(`/services/${id}`)
  }

  const handleDeleteService = async (id: string) => {
    if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', id)
        
        if (error) {
          console.error('Error deleting service:', error)
          alert('Failed to delete service')
        } else {
          setServices(services.filter(service => service.id !== id))
          alert('Service deleted successfully')
        }
      } catch (error) {
        console.error('Error:', error)
        alert('An unexpected error occurred')
      }
    }
  }

  const handleManageAvailability = () => {
    router.push('/services/availability')
  }

  const handleServiceAvailability = (id: string) => {
    router.push(`/services/availability?serviceId=${id}`)
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 
      ? `${hours} hr ${remainingMinutes} min` 
      : `${hours} hr`
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price)
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Services</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleManageAvailability}>
            <Calendar className="mr-2 h-4 w-4" /> Manage Availability
          </Button>
          <Button onClick={handleCreateService}>
            <Plus className="mr-2 h-4 w-4" /> Add Service
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full mb-4" />
                <div className="flex gap-2 mb-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : services.length === 0 ? (
        <Card className="text-center p-6">
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">You haven't created any services yet.</p>
            <Button onClick={handleCreateService}>
              <Plus className="mr-2 h-4 w-4" /> Create Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{service.name}</CardTitle>
                {service.category && (
                  <Badge variant="outline" className="mt-1">
                    <Tag className="h-3 w-3 mr-1" />
                    {service.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {service.description && (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {service.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="secondary" className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(service.duration)}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {formatPrice(service.price)}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleServiceAvailability(service.id)}
                  className="mr-auto"
                >
                  <Calendar className="h-3 w-3 mr-1" /> Availability
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleEditService(service.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteService(service.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 
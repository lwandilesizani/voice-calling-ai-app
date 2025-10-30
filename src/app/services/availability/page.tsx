'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Clock, Plus, Edit, Trash2, AlertCircle, CalendarDays, List } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AvailabilityCalendar } from '@/components/availability-calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Define types based on our database schema
type Service = {
  id: string
  name: string
  price: number
  description: string | null
  duration: number
  category: string | null
}

type ServiceAvailability = {
  id: string
  service_id: string
  day_of_week: string
  start_time: string
  end_time: string
  break_between: number
  max_concurrent: number
}

type BreakTime = {
  id?: string
  service_availability_id?: string
  start_time: string
  end_time: string
}

export default function ServiceAvailabilityPage() {
  const [services, setServices] = useState<Service[]>([])
  const [availabilities, setAvailabilities] = useState<ServiceAvailability[]>([])
  const [breakTimes, setBreakTimes] = useState<Record<string, BreakTime[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentAvailability, setCurrentAvailability] = useState<Partial<ServiceAvailability>>({
    day_of_week: 'monday',
    start_time: '09:00',
    end_time: '17:00',
    break_between: 0,
    max_concurrent: 1
  })
  const [currentBreakTimes, setCurrentBreakTimes] = useState<BreakTime[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [availabilityToDelete, setAvailabilityToDelete] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [bookings, setBookings] = useState<any[]>([])
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const dayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ]

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    // Check if a specific service ID was passed in the URL
    const serviceId = searchParams ? searchParams.get('serviceId') : null
    if (serviceId && services.some(service => service.id === serviceId)) {
      setSelectedService(serviceId)
    } else if (selectedService === '' && services.length > 0) {
      // Set the first service as selected if available and no specific service was requested
      setSelectedService(services[0].id)
    }
  }, [services, searchParams])

  useEffect(() => {
    if (selectedService) {
      fetchAvailability(selectedService)
    } else {
      setAvailabilities([])
      setBreakTimes({})
    }
  }, [selectedService])

  useEffect(() => {
    if (selectedService) {
      fetchBookings(selectedService)
    }
  }, [selectedService])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError || !userData.user) {
        throw new Error('User not authenticated')
      }
      
      // Get business ID for the current user
      const { data: businessData, error: businessError } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', userData.user.id)
        .single()
        
      if (businessError || !businessData) {
        throw new Error('Business profile not found')
      }
      
      // Get services for this business
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, description, duration, category')
        .eq('business_id', businessData.id)
        
      if (error) {
        throw error
      }
      
      setServices(data || [])
      
      // Set the first service as selected if available
      if (data && data.length > 0) {
        setSelectedService(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load services',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailability = async (serviceId: string) => {
    try {
      setLoading(true)
      
      // Get availability for this service
      const { data, error } = await supabase
        .from('service_availability')
        .select('*')
        .eq('service_id', serviceId)
        
      if (error) {
        throw error
      }
      
      setAvailabilities(data || [])
      
      // Fetch break times for each availability
      const breakTimesMap: Record<string, BreakTime[]> = {}
      
      for (const availability of data || []) {
        const { data: breaks, error: breaksError } = await supabase
          .from('service_break_times')
          .select('*')
          .eq('service_availability_id', availability.id)
          
        if (breaksError) {
          console.error('Error fetching break times:', breaksError)
          continue
        }
        
        breakTimesMap[availability.id] = breaks || []
      }
      
      setBreakTimes(breakTimesMap)
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load availability',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async (serviceId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_date, booking_time, customer_name')
        .eq('service_id', serviceId)
        .eq('status', 'confirmed')
        
      if (error) {
        console.error('Error fetching bookings:', error)
        return
      }
      
      // Transform the data to match the format expected by the calendar
      const formattedBookings = data.map(booking => ({
        date: booking.booking_date,
        time: booking.booking_time,
        customer_name: booking.customer_name
      }))
      
      setBookings(formattedBookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const handleAddAvailability = () => {
    setIsEditing(false)
    setCurrentAvailability({
      day_of_week: 'monday',
      start_time: '09:00',
      end_time: '17:00',
      break_between: 0,
      max_concurrent: 1
    })
    setCurrentBreakTimes([])
    setIsDialogOpen(true)
  }

  const handleEditAvailability = (availability: ServiceAvailability) => {
    setIsEditing(true)
    setCurrentAvailability(availability)
    setCurrentBreakTimes(breakTimes[availability.id] || [])
    setIsDialogOpen(true)
  }

  const handleDeleteAvailability = (availabilityId: string) => {
    setAvailabilityToDelete(availabilityId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteAvailability = async () => {
    if (!availabilityToDelete) return
    
    try {
      // Delete break times first (should cascade, but just to be safe)
      await supabase
        .from('service_break_times')
        .delete()
        .eq('service_availability_id', availabilityToDelete)
      
      // Delete availability
      const { error } = await supabase
        .from('service_availability')
        .delete()
        .eq('id', availabilityToDelete)
        
      if (error) {
        throw error
      }
      
      // Update state
      setAvailabilities(availabilities.filter(a => a.id !== availabilityToDelete))
      
      // Remove break times for this availability
      const newBreakTimes = { ...breakTimes }
      delete newBreakTimes[availabilityToDelete]
      setBreakTimes(newBreakTimes)
      
      toast({
        title: 'Success',
        description: 'Availability deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting availability:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete availability',
        variant: 'destructive',
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setAvailabilityToDelete(null)
    }
  }

  const handleAddBreakTime = () => {
    setCurrentBreakTimes([
      ...currentBreakTimes,
      { start_time: '12:00', end_time: '13:00' }
    ])
  }

  const handleRemoveBreakTime = (index: number) => {
    setCurrentBreakTimes(currentBreakTimes.filter((_, i) => i !== index))
  }

  const handleBreakTimeChange = (index: number, field: keyof BreakTime, value: string) => {
    const updatedBreakTimes = [...currentBreakTimes]
    updatedBreakTimes[index] = {
      ...updatedBreakTimes[index],
      [field]: value
    }
    setCurrentBreakTimes(updatedBreakTimes)
  }

  const handleAvailabilityChange = (field: keyof ServiceAvailability, value: any) => {
    setCurrentAvailability({
      ...currentAvailability,
      [field]: value
    })
  }

  const handleSaveAvailability = async () => {
    try {
      if (!selectedService) {
        throw new Error('No service selected')
      }
      
      // Validate inputs
      if (!currentAvailability.day_of_week || !currentAvailability.start_time || !currentAvailability.end_time) {
        throw new Error('Please fill in all required fields')
      }
      
      // Check if start time is before end time
      if (currentAvailability.start_time >= currentAvailability.end_time) {
        throw new Error('Start time must be before end time')
      }
      
      // Validate break times
      for (const breakTime of currentBreakTimes) {
        if (!breakTime.start_time || !breakTime.end_time) {
          throw new Error('Please fill in all break time fields')
        }
        
        if (breakTime.start_time >= breakTime.end_time) {
          throw new Error('Break start time must be before end time')
        }
        
        // Check if break time is within availability hours
        if (breakTime.start_time < currentAvailability.start_time || breakTime.end_time > currentAvailability.end_time) {
          throw new Error('Break times must be within availability hours')
        }
      }
      
      let availabilityId: string
      
      if (isEditing && currentAvailability.id) {
        // Update existing availability
        const { data, error } = await supabase
          .from('service_availability')
          .update({
            day_of_week: currentAvailability.day_of_week,
            start_time: currentAvailability.start_time,
            end_time: currentAvailability.end_time,
            break_between: currentAvailability.break_between,
            max_concurrent: currentAvailability.max_concurrent,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentAvailability.id)
          .select()
          .single()
          
        if (error) {
          throw error
        }
        
        availabilityId = currentAvailability.id
        
        // Update state
        setAvailabilities(availabilities.map(a => 
          a.id === availabilityId ? { ...a, ...data } : a
        ))
      } else {
        // Check if availability already exists for this day
        const existingAvailability = availabilities.find(
          a => a.day_of_week === currentAvailability.day_of_week
        )
        
        if (existingAvailability) {
          throw new Error(`Availability for ${currentAvailability.day_of_week} already exists`)
        }
        
        // Create new availability
        const { data, error } = await supabase
          .from('service_availability')
          .insert({
            service_id: selectedService,
            day_of_week: currentAvailability.day_of_week,
            start_time: currentAvailability.start_time,
            end_time: currentAvailability.end_time,
            break_between: currentAvailability.break_between || 0,
            max_concurrent: currentAvailability.max_concurrent || 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
          
        if (error) {
          throw error
        }
        
        availabilityId = data.id
        
        // Update state
        setAvailabilities([...availabilities, data])
      }
      
      // Handle break times
      if (isEditing) {
        // Delete existing break times
        await supabase
          .from('service_break_times')
          .delete()
          .eq('service_availability_id', availabilityId)
      }
      
      // Add new break times
      if (currentBreakTimes.length > 0) {
        const breakTimesData = currentBreakTimes.map(breakTime => ({
          service_availability_id: availabilityId,
          start_time: breakTime.start_time,
          end_time: breakTime.end_time,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
        
        const { data: newBreakTimes, error: breakTimesError } = await supabase
          .from('service_break_times')
          .insert(breakTimesData)
          .select()
          
        if (breakTimesError) {
          throw breakTimesError
        }
        
        // Update state
        setBreakTimes({
          ...breakTimes,
          [availabilityId]: newBreakTimes
        })
      } else {
        // Clear break times for this availability
        setBreakTimes({
          ...breakTimes,
          [availabilityId]: []
        })
      }
      
      toast({
        title: 'Success',
        description: `Availability ${isEditing ? 'updated' : 'created'} successfully`,
      })
      
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving availability:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save availability',
        variant: 'destructive',
      })
    }
  }

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0)
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } catch (e) {
      return time
    }
  }

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1)
  }

  const handleSlotClick = (slot: any) => {
    // This function could be used to handle slot selection, e.g., to create a booking
    console.log('Slot clicked:', slot)
    toast({
      title: 'Slot Selected',
      description: `Selected ${slot.date} at ${formatTime(slot.time)}`,
    })
  }

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push('/services')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Button>
        <h1 className="text-3xl font-bold">Service Availability</h1>
      </div>
      
      {services.length === 0 && !loading ? (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No services found</AlertTitle>
          <AlertDescription>
            You need to create services before you can manage their availability.
            <div className="mt-2">
              <Button onClick={() => router.push('/services/new')}>
                <Plus className="mr-2 h-4 w-4" /> Create Service
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="mb-6">
            <Label htmlFor="service-select" className="block mb-2">Select Service</Label>
            <Select
              value={selectedService}
              onValueChange={setSelectedService}
              disabled={loading || services.length === 0}
            >
              <SelectTrigger id="service-select" className="w-full md:w-1/2">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedService && (
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Availability Schedule</h2>
              <div className="flex gap-2">
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'list' | 'calendar')}>
                  <TabsList>
                    <TabsTrigger value="list">
                      <List className="h-4 w-4 mr-2" />
                      List View
                    </TabsTrigger>
                    <TabsTrigger value="calendar">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Calendar View
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button onClick={handleAddAvailability}>
                  <Plus className="mr-2 h-4 w-4" /> Add Availability
                </Button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : selectedService && (
            <>
              {viewMode === 'list' ? (
                // List view
                availabilities.length === 0 ? (
                  <Card className="text-center p-6">
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground mb-4">No availability set for this service yet.</p>
                      <Button onClick={handleAddAvailability}>
                        <Plus className="mr-2 h-4 w-4" /> Add Your First Availability
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availabilities
                      .sort((a, b) => {
                        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                        return days.indexOf(a.day_of_week) - days.indexOf(b.day_of_week)
                      })
                      .map((availability) => (
                        <Card key={availability.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{formatDay(availability.day_of_week)}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                <span>
                                  {formatTime(availability.start_time)} - {formatTime(availability.end_time)}
                                </span>
                              </div>
                              
                              {availability.break_between > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  {availability.break_between} min break between appointments
                                </div>
                              )}
                              
                              {availability.max_concurrent > 1 && (
                                <div className="text-sm text-muted-foreground">
                                  Up to {availability.max_concurrent} concurrent appointments
                                </div>
                              )}
                              
                              {breakTimes[availability.id]?.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-sm font-medium mb-1">Break Times:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {breakTimes[availability.id].map((breakTime, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {formatTime(breakTime.start_time)} - {formatTime(breakTime.end_time)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleEditAvailability(availability)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteAvailability(availability.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                  </div>
                )
              ) : (
                // Calendar view
                <Card>
                  <CardContent className="pt-6">
                    {availabilities.length === 0 ? (
                      <div className="text-center">
                        <p className="text-muted-foreground mb-4">No availability set for this service yet.</p>
                        <Button onClick={handleAddAvailability}>
                          <Plus className="mr-2 h-4 w-4" /> Add Your First Availability
                        </Button>
                      </div>
                    ) : (
                      <AvailabilityCalendar 
                        serviceId={selectedService}
                        availabilityData={availabilities}
                        bookings={bookings}
                        onSlotClick={handleSlotClick}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
      
      {/* Add/Edit Availability Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Availability' : 'Add Availability'}</DialogTitle>
            <DialogDescription>
              Set the hours when this service is available.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select
                value={currentAvailability.day_of_week}
                onValueChange={(value) => handleAvailabilityChange('day_of_week', value)}
                disabled={isEditing}
              >
                <SelectTrigger id="day">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={currentAvailability.start_time}
                  onChange={(e) => handleAvailabilityChange('start_time', e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={currentAvailability.end_time}
                  onChange={(e) => handleAvailabilityChange('end_time', e.target.value)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="break-between">Break Between (minutes)</Label>
                <Input
                  id="break-between"
                  type="number"
                  min="0"
                  value={currentAvailability.break_between}
                  onChange={(e) => handleAvailabilityChange('break_between', parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="max-concurrent">Max Concurrent Bookings</Label>
                <Input
                  id="max-concurrent"
                  type="number"
                  min="1"
                  value={currentAvailability.max_concurrent}
                  onChange={(e) => handleAvailabilityChange('max_concurrent', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Break Times</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddBreakTime}>
                  <Plus className="h-3 w-3 mr-1" /> Add Break
                </Button>
              </div>
              
              {currentBreakTimes.length > 0 ? (
                <div className="space-y-3 mt-2">
                  {currentBreakTimes.map((breakTime, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={breakTime.start_time}
                        onChange={(e) => handleBreakTimeChange(index, 'start_time', e.target.value)}
                        className="flex-1"
                      />
                      <span>to</span>
                      <Input
                        type="time"
                        value={breakTime.end_time}
                        onChange={(e) => handleBreakTimeChange(index, 'end_time', e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleRemoveBreakTime(index)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No break times added.</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAvailability}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this availability? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAvailability}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
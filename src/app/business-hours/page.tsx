'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Clock, Plus, Edit, Trash2, AlertCircle, Save, Loader2, CalendarDays, List } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BusinessHoursCalendar } from '@/components/business-hours-calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type BusinessHour = {
  day_of_week: string
  is_open: boolean
  start_time: string
  end_time: string
}

export default function BusinessHoursPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([
    { day_of_week: 'monday', is_open: true, start_time: '09:00', end_time: '17:00' },
    { day_of_week: 'tuesday', is_open: true, start_time: '09:00', end_time: '17:00' },
    { day_of_week: 'wednesday', is_open: true, start_time: '09:00', end_time: '17:00' },
    { day_of_week: 'thursday', is_open: true, start_time: '09:00', end_time: '17:00' },
    { day_of_week: 'friday', is_open: true, start_time: '09:00', end_time: '17:00' },
    { day_of_week: 'saturday', is_open: false, start_time: '09:00', end_time: '17:00' },
    { day_of_week: 'sunday', is_open: false, start_time: '09:00', end_time: '17:00' },
  ])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams ? searchParams.get('returnTo') : null
  const { toast } = useToast()

  useEffect(() => {
    fetchBusinessHours()
  }, [])

  const fetchBusinessHours = async () => {
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
      
      setBusinessId(businessData.id)
      
      // Get business hours for this business
      const { data: businessHoursData, error: businessHoursError } = await supabase
        .from('business_hours')
        .select('day_of_week, is_open, start_time, end_time')
        .eq('business_id', businessData.id)
      
      let availabilityData = businessHoursData || []
      let availabilityError = businessHoursError
      
      if (availabilityError) {
        console.error('Error fetching business hours:', availabilityError)
        // Continue with default hours
      } else if (availabilityData && availabilityData.length > 0) {
        // Map the availability data to our business hours format
        const hours = [...businessHours]
        availabilityData.forEach(avail => {
          const index = hours.findIndex(h => h.day_of_week === avail.day_of_week)
          if (index !== -1) {
            hours[index] = {
              ...hours[index],
              is_open: avail.is_open,
              start_time: avail.start_time,
              end_time: avail.end_time
            }
          }
        })
        setBusinessHours(hours)
      }
    } catch (error) {
      console.error('Error fetching business hours:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load business hours',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDay = (day: string) => {
    setBusinessHours(prev => 
      prev.map(hour => 
        hour.day_of_week === day 
          ? { ...hour, is_open: !hour.is_open } 
          : hour
      )
    )
  }

  const handleTimeChange = (day: string, field: 'start_time' | 'end_time', value: string) => {
    setBusinessHours(prev => 
      prev.map(hour => 
        hour.day_of_week === day 
          ? { ...hour, [field]: value } 
          : hour
      )
    )
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      if (!businessId) {
        throw new Error('Business ID not found')
      }
      
      // Delete existing business hours
      const { error: deleteError } = await supabase
        .from('business_hours')
        .delete()
        .eq('business_id', businessId)
      
      if (deleteError) {
        throw deleteError
      }
      
      // Insert new business hours
      const hoursToInsert = businessHours.map(hour => ({
        business_id: businessId,
        day_of_week: hour.day_of_week,
        is_open: hour.is_open,
        start_time: hour.start_time,
        end_time: hour.end_time
      }))
      
      const { error: insertError } = await supabase
        .from('business_hours')
        .insert(hoursToInsert)
      
      if (insertError) {
        throw insertError
      }
      
      toast({
        title: "Success",
        description: "Business hours updated successfully",
      })
      
      // Redirect to returnTo URL if provided
      if (returnTo) {
        router.push(decodeURIComponent(returnTo))
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update business hours",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1)
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

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push('/business-profile')} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Business Profile
        </Button>
        <h1 className="text-3xl font-bold">Business Hours</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Operating Hours</CardTitle>
            <CardDescription>
              Set your regular business hours. These hours will be used as the default for all your services.
            </CardDescription>
          </div>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'calendar')}>
            <TabsList>
              <TabsTrigger value="table">
                <List className="h-4 w-4 mr-2" />
                Table View
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarDays className="h-4 w-4 mr-2" />
                Calendar View
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              ))}
            </div>
          ) : viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Open</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessHours.map((hour) => (
                  <TableRow key={hour.day_of_week}>
                    <TableCell className="font-medium">{formatDay(hour.day_of_week)}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={hour.is_open} 
                        onCheckedChange={() => handleToggleDay(hour.day_of_week)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={hour.start_time}
                        onChange={(e) => handleTimeChange(hour.day_of_week, 'start_time', e.target.value)}
                        disabled={!hour.is_open}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="time"
                        value={hour.end_time}
                        onChange={(e) => handleTimeChange(hour.day_of_week, 'end_time', e.target.value)}
                        disabled={!hour.is_open}
                        className="w-32"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <BusinessHoursCalendar businessHours={businessHours} />
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Hours
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>
          Your business hours set the general operating hours for your business. 
          You can set specific availability for each service separately in the Services section.
        </AlertDescription>
      </Alert>
    </div>
  )
} 
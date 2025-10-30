'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type AvailabilitySlot = {
  date: string
  time: string
  available: boolean
  booked?: boolean
}

type CalendarProps = {
  serviceId: string
  availabilityData: {
    day_of_week: string
    start_time: string
    end_time: string
    break_between: number
    max_concurrent: number
  }[]
  bookings?: {
    date: string
    time: string
    customer_name: string
  }[]
  onSlotClick?: (slot: AvailabilitySlot) => void
}

export function AvailabilityCalendar({ serviceId, availabilityData, bookings = [], onSlotClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<Record<string, AvailabilitySlot[]>>({})
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Generate calendar days for the current month view
  useEffect(() => {
    const days: Date[] = []
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1)
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0)
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay()
    
    // Add days from the previous month to fill the first week
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i))
    }
    
    // Add all days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    // Add days from the next month to complete the last week
    const remainingDays = 7 - (days.length % 7)
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push(new Date(year, month + 1, i))
      }
    }
    
    setCalendarDays(days)
  }, [currentDate])

  // Generate availability slots based on the service availability data
  useEffect(() => {
    if (!availabilityData.length) return
    
    const slots: Record<string, AvailabilitySlot[]> = {}
    
    // Map day numbers to day names
    const dayMap: Record<number, string> = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    }
    
    // Generate slots for each day in the calendar
    calendarDays.forEach(day => {
      const dateStr = day.toISOString().split('T')[0]
      const dayOfWeek = dayMap[day.getDay()]
      
      // Find availability for this day of the week
      const availability = availabilityData.find(a => a.day_of_week === dayOfWeek)
      
      if (!availability) {
        slots[dateStr] = []
        return
      }
      
      // Generate time slots based on availability
      const daySlots: AvailabilitySlot[] = []
      const { start_time, end_time, break_between } = availability
      
      // Convert times to minutes for easier calculation
      const startParts = start_time.split(':').map(Number)
      const endParts = end_time.split(':').map(Number)
      const startTotalMinutes = startParts[0] * 60 + startParts[1]
      const endTotalMinutes = endParts[0] * 60 + endParts[1]
      
      // Default service duration (30 minutes if not specified)
      const serviceDuration = 30
      
      // Generate slots
      for (let minutes = startTotalMinutes; minutes + serviceDuration <= endTotalMinutes; minutes += serviceDuration + break_between) {
        const hour = Math.floor(minutes / 60)
        const minute = minutes % 60
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        
        // Check if this slot is booked
        const isBooked = bookings.some(booking => 
          booking.date === dateStr && booking.time === timeStr
        )
        
        daySlots.push({
          date: dateStr,
          time: timeStr,
          available: !isBooked,
          booked: isBooked
        })
      }
      
      slots[dateStr] = daySlots
    })
    
    setAvailabilitySlots(slots)
  }, [calendarDays, availabilityData, bookings])

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    setSelectedDate(dateStr === selectedDate ? null : dateStr)
  }

  const handleSlotClick = (slot: AvailabilitySlot) => {
    if (onSlotClick) {
      onSlotClick(slot)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="text-center font-medium py-2">
            {day}
          </div>
        ))}
        
        {calendarDays.map((day, index) => {
          const dateStr = day.toISOString().split('T')[0]
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = new Date().toISOString().split('T')[0] === dateStr
          const isSelected = dateStr === selectedDate
          const hasAvailability = availabilitySlots[dateStr]?.some(slot => slot.available)
          const hasBookings = availabilitySlots[dateStr]?.some(slot => slot.booked)
          
          return (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "h-12 rounded-md relative",
                !isCurrentMonth && "text-muted-foreground opacity-50",
                isToday && "border border-primary",
                isSelected && "bg-primary/10",
                hasAvailability && "font-medium"
              )}
              onClick={() => handleDateClick(day)}
            >
              <span>{day.getDate()}</span>
              {hasAvailability && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <span className="block h-1 w-1 rounded-full bg-green-500"></span>
                </span>
              )}
              {hasBookings && (
                <span className="absolute bottom-1 right-1">
                  <span className="block h-1 w-1 rounded-full bg-blue-500"></span>
                </span>
              )}
            </Button>
          )
        })}
      </div>
      
      {selectedDate && availabilitySlots[selectedDate]?.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">
              Available Slots for {new Date(selectedDate).toLocaleDateString()}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {availabilitySlots[selectedDate].map((slot, index) => (
                <Badge
                  key={index}
                  variant={slot.available ? "outline" : "secondary"}
                  className={cn(
                    "py-2 px-3 cursor-pointer text-center",
                    slot.available ? "hover:bg-primary/10" : "opacity-50 cursor-not-allowed",
                    slot.booked && "bg-blue-100 text-blue-800 hover:bg-blue-100"
                  )}
                  onClick={() => slot.available && handleSlotClick(slot)}
                >
                  {formatTime(slot.time)}
                  {slot.booked && " (Booked)"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedDate && availabilitySlots[selectedDate]?.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No availability for this date.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type CalendarProps = {
  availableDates: AvailableDate[]
  onDateSelect: (date: string) => void
  onSlotSelect?: (date: string, slot: TimeSlot) => void
  onAddSlot?: (date: string) => void
  selectedDate?: string
  className?: string
}

export type TimeSlot = {
  time: string
  available: boolean
}

export type AvailableDate = {
  date: string
  slots: TimeSlot[]
}

export function AvailabilityCalendar({
  availableDates,
  onDateSelect,
  onSlotSelect,
  onAddSlot,
  selectedDate,
  className
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [calendarDays, setCalendarDays] = useState<Array<{ date: Date | null, hasSlots: boolean }>>([])
  
  // Generate calendar days for the current month
  useEffect(() => {
    const days = generateCalendarDays(currentMonth)
    setCalendarDays(days)
  }, [currentMonth, availableDates])
  
  // Generate an array of days for the calendar
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1)
    const firstDayIndex = firstDay.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0)
    const lastDate = lastDay.getDate()
    
    const daysArray: Array<{ date: Date | null, hasSlots: boolean }> = []
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push({ date: null, hasSlots: false })
    }
    
    // Add days of the month
    for (let i = 1; i <= lastDate; i++) {
      const currentDate = new Date(year, month, i)
      const dateString = formatDateToYYYYMMDD(currentDate)
      const hasSlots = availableDates.some(d => d.date === dateString && d.slots.length > 0)
      
      daysArray.push({ date: currentDate, hasSlots })
    }
    
    // Add empty slots to complete the last week if needed
    const remainingSlots = 42 - daysArray.length // 6 rows of 7 days
    for (let i = 0; i < remainingSlots; i++) {
      daysArray.push({ date: null, hasSlots: false })
    }
    
    return daysArray
  }
  
  // Format a date to YYYY-MM-DD
  const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Navigate to the previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  // Navigate to the next month
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  
  // Format the month and year for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  
  // Get the day names for the calendar header
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Get the slots for the selected date
  const getSelectedDateSlots = () => {
    if (!selectedDate) return []
    const dateData = availableDates.find(d => d.date === selectedDate)
    return dateData ? dateData.slots : []
  }
  
  // Format time for display
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
    <div className={cn("space-y-4", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium">{formatMonthYear(currentMonth)}</h3>
        <Button variant="outline" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Names */}
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium py-1">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={cn(
              "aspect-square p-1 relative",
              day.date ? "cursor-pointer hover:bg-accent rounded-md" : "",
              selectedDate && day.date && formatDateToYYYYMMDD(day.date) === selectedDate ? "bg-accent" : ""
            )}
            onClick={() => day.date && onDateSelect(formatDateToYYYYMMDD(day.date))}
          >
            {day.date && (
              <>
                <span className="text-sm">{day.date.getDate()}</span>
                {day.hasSlots && (
                  <div className="absolute bottom-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </>
            )}
          </div>
        ))}
      </div>
      
      {/* Selected Date Slots */}
      {selectedDate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {onAddSlot && (
                <Button variant="outline" size="sm" onClick={() => onAddSlot(selectedDate)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Slot
                </Button>
              )}
            </div>
            
            {getSelectedDateSlots().length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>No availability slots for this date.</p>
                {onAddSlot && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => onAddSlot(selectedDate)}>
                    <Plus className="h-3 w-3 mr-1" /> Add Slot
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {getSelectedDateSlots().map((slot, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={slot.available ? "outline" : "secondary"}
                          className={cn(
                            "flex items-center justify-center py-2 cursor-pointer",
                            slot.available ? "hover:bg-primary hover:text-primary-foreground" : "opacity-50"
                          )}
                          onClick={() => onSlotSelect && onSlotSelect(selectedDate, slot)}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(slot.time)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {slot.available ? "Available" : "Unavailable"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type BusinessHour = {
  day_of_week: string
  is_open: boolean
  start_time: string
  end_time: string
}

type BusinessHoursCalendarProps = {
  businessHours: BusinessHour[]
}

export function BusinessHoursCalendar({ businessHours }: BusinessHoursCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  
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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getDayStatus = (date: Date): { isOpen: boolean; hours: string } => {
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
    
    const dayOfWeek = dayMap[date.getDay()]
    const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek)
    
    if (!dayHours || !dayHours.is_open) {
      return { isOpen: false, hours: 'Closed' }
    }
    
    return {
      isOpen: true,
      hours: `${formatTime(dayHours.start_time)} - ${formatTime(dayHours.end_time)}`
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
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = new Date().toISOString().split('T')[0] === day.toISOString().split('T')[0]
          const { isOpen, hours } = getDayStatus(day)
          
          return (
            <div
              key={index}
              className={cn(
                "h-24 border rounded-md p-1 relative",
                !isCurrentMonth && "opacity-50 bg-muted/20",
                isToday && "border-primary",
                isOpen ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
              )}
            >
              <div className="text-right mb-1">
                <span className={cn(
                  "inline-block w-6 h-6 rounded-full text-center leading-6 text-sm",
                  isToday && "bg-primary text-primary-foreground"
                )}>
                  {day.getDate()}
                </span>
              </div>
              <div className={cn(
                "text-xs",
                isOpen ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
              )}>
                {hours}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 
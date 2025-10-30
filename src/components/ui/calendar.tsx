"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
// We'll create a simplified version that doesn't rely on react-day-picker
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = {
  className?: string
  classNames?: Record<string, string>
  showOutsideDays?: boolean
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | { from: Date; to: Date }
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
  month?: Date
  onMonthChange?: (month: Date) => void
  captionLayout?: "buttons" | "dropdown"
  fromYear?: number
  toYear?: number
  fixedWeeks?: boolean
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  // This is a simplified calendar that just shows the current month
  // In a real implementation, you would use react-day-picker
  const today = new Date()
  const [currentMonth, setCurrentMonth] = React.useState(today)
  
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()
  
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  
  const handleDayClick = (day: number) => {
    if (props.onSelect) {
      const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      props.onSelect(selectedDate)
    }
  }
  
  const isSelected = (day: number) => {
    if (!props.selected) return false
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    
    if (props.selected instanceof Date) {
      return date.toDateString() === props.selected.toDateString()
    }
    
    return false
  }
  
  const isDisabled = (day: number) => {
    if (!props.disabled) return false
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return props.disabled(date)
  }
  
  const monthName = currentMonth.toLocaleString('default', { month: 'long' })
  const year = currentMonth.getFullYear()
  
  // Create calendar grid
  const days = []
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 w-9" />)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = 
      today.getDate() === day && 
      today.getMonth() === currentMonth.getMonth() && 
      today.getFullYear() === currentMonth.getFullYear()
    
    days.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        disabled={isDisabled(day)}
        className={cn(
          "h-9 w-9 rounded-md p-0 font-normal",
          isToday && "bg-accent text-accent-foreground",
          isSelected(day) && "bg-primary text-primary-foreground",
          isDisabled(day) && "text-muted-foreground opacity-50"
        )}
      >
        {day}
      </button>
    )
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </button>
        <div className="font-medium">
          {monthName} {year}
        </div>
        <button
          onClick={nextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground">
            {day.charAt(0)}
          </div>
        ))}
        {days}
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar } 
"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  time: string | undefined
  setTime: (time: string) => void
  className?: string
  disabled?: boolean
  availableTimeSlots?: string[]
}

export function TimePicker({ 
  time, 
  setTime, 
  className, 
  disabled,
  availableTimeSlots = [] 
}: TimePickerProps) {
  return (
    <Select
      value={time}
      onValueChange={setTime}
      disabled={disabled || availableTimeSlots.length === 0}
    >
      <SelectTrigger 
        className={cn(
          "w-full justify-start text-left font-normal",
          !time && "text-muted-foreground",
          className
        )}
      >
        <Clock className="mr-2 h-4 w-4" />
        {time ? time : <span>Select a time</span>}
      </SelectTrigger>
      <SelectContent>
        {availableTimeSlots.length > 0 ? (
          availableTimeSlots.map((slot) => (
            <SelectItem key={slot} value={slot}>
              {slot}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-slots" disabled>
            No available time slots
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
} 
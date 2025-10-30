'use client'

import { useEffect, useState } from 'react'
import { settingsService } from '@/lib/services/settings'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingSwitch } from '@/components/ui/loading-switch'

// Define the type for AutomationSettings
type AutomationSettings = {
  automation_enabled: boolean;
}

// Update the component to accept initialSettings and onSettingsUpdate props
export function AutomationControl({ 
  initialSettings,
  onSettingsUpdate
}: { 
  initialSettings: AutomationSettings | null;
  onSettingsUpdate?: (enabled: boolean) => void;
}) {
  const [enabled, setEnabled] = useState(initialSettings?.automation_enabled ?? false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  // Update local state when initialSettings changes
  useEffect(() => {
    if (initialSettings !== null) {
      setEnabled(initialSettings.automation_enabled)
    }
  }, [initialSettings])

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await settingsService.getAutomationSettings()
      setEnabled(settings.automation_enabled)
    }

    if (!initialSettings) {
      fetchSettings()
    }
  }, [initialSettings])

  const handleToggle = async (newState: boolean) => {
    setIsUpdating(true)
    
    try {
      const result = await settingsService.updateAutomationEnabled(newState)
      
      if (result.success) {
        setEnabled(newState)
        if (onSettingsUpdate) {
          onSettingsUpdate(newState)
        }
        toast({
          title: newState ? "Outbound Calling Enabled" : "Outbound Calling Disabled",
          description: newState 
            ? "System is now making calls to leads" 
            : "Outbound calling has been paused",
          variant: "success",
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to update settings: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!initialSettings) {
    return (
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border shadow-sm mb-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-[180px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-10" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border shadow-sm mb-4">
      <div className="space-y-0.5">
        <div className="text-lg font-semibold">Outbound Call System</div>
        <p className="text-sm text-muted-foreground">
          {enabled ? 'System is actively making calls' : 'System is paused'}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <LoadingSwitch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isUpdating}
          isLoading={isUpdating}
          aria-label="Toggle outbound calling"
        />
        <span className="text-sm font-medium min-w-[3rem]">
          {enabled ? 'Active' : 'Paused'}
        </span>
      </div>
    </div>
  )
}

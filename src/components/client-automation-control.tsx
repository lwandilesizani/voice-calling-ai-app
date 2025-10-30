'use client';

import { useCallback, useState, useEffect } from 'react';
import { AutomationControl } from './automation-control';
import { settingsService } from '@/lib/services/settings';
import type { AutomationSettings } from '@/lib/services/settings';

export function ClientAutomationControl({ 
  initialSettings 
}: { 
  initialSettings: AutomationSettings | null 
}) {
  const [settings, setSettings] = useState<AutomationSettings | null>(initialSettings);

  // Fetch settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      const newSettings = await settingsService.getAutomationSettings();
      setSettings(newSettings);
    };
    loadSettings();
  }, []);

  // Handle settings updates
  const handleSettingsUpdate = useCallback(async (enabled: boolean) => {
    await settingsService.updateAutomationEnabled(enabled);
    const newSettings = await settingsService.getAutomationSettings();
    setSettings(newSettings);
  }, []);

  return (
    <AutomationControl 
      initialSettings={settings} 
      onSettingsUpdate={handleSettingsUpdate}
    />
  );
}

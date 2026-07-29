'use client';

import { useState, useEffect } from 'react';

import { adminGetHireSettings, adminUpdateHireSettings } from '@/api';
import type { HireSettings } from '@/types/HireBooking';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import HireSettingsForm from './_components/HireSettingsForm';

export default function AdminHireSettingsPage() {
  const [settings, setSettings] = useState<HireSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminGetHireSettings()
      .then((data) => { if (!cancelled) setSettings(data); })
      .catch(() => {
        if (!cancelled) setNotification({ message: 'Failed to load hire settings.', type: 'error' });
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setNotification(null);
    try {
      const updated = await adminUpdateHireSettings(settings);
      setSettings(updated);
      setNotification({ message: 'Settings saved.', type: 'success' });
    } catch {
      setNotification({ message: 'Failed to save settings.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-10 w-10" />
      </div>
    );
  }

  if (!settings) {
    return <p className="p-4 text-destructive">Could not load hire settings.</p>;
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Hire Settings</h1>

      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <HireSettingsForm
        settings={settings}
        isSaving={isSaving}
        onChange={setSettings}
        onSave={handleSave}
      />
    </div>
  );
}

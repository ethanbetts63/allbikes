'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import { adminGetHireSettings, adminUpdateHireSettings } from '@/lib/api';
import type { HireSettings } from '@/types/HireBooking';
import { Spinner } from '@/components/ui/spinner';
import HireSettingsForm from './_components/HireSettingsForm';

export default function AdminHireSettingsPage() {
  const [settings, setSettings] = useState<HireSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminGetHireSettings()
      .then((data) => { if (!cancelled) setSettings(data); })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load hire settings.');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const updated = await adminUpdateHireSettings(settings);
      setSettings(updated);
      toast.success('Settings saved.');
    } catch {
      toast.error('Failed to save settings.');
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

      <HireSettingsForm
        settings={settings}
        isSaving={isSaving}
        onChange={setSettings}
        onSave={handleSave}
      />
    </div>
  );
}

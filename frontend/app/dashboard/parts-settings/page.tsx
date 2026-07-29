'use client';

import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { adminGetPartsSettings, adminUpdatePartsSettings } from '@/services/partsSettingsService';
import PartsSettingsForm from './_components/PartsSettingsForm';
import {
  NUMERIC_FIELDS, type PartsSettings, settingsAreDirty,
} from './_lib/partsSettings';

export default function PartsSettingsPage() {
  const [settings, setSettings] = useState<PartsSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<PartsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminGetPartsSettings()
      .then((data) => {
        if (cancelled) return;
        setSettings(data);
        setSavedSettings(data);
      })
      .catch((error: Error) => { if (!cancelled) setMessage({ text: error.message, error: true }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (next: PartsSettings) => {
    setSettings(next);
    setMessage(null);
  };

  const save = async () => {
    if (!settings) return;
    const values = NUMERIC_FIELDS.map(({ key }) => Number(settings[key]));
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      setMessage({ text: 'Enter valid amounts of $0 or more.', error: true });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const data = await adminUpdatePartsSettings({
        markup_percentage: Number(settings.markup_percentage).toFixed(2),
        shipping_fee: Number(settings.shipping_fee).toFixed(2),
        enable_new_part_sales: settings.enable_new_part_sales,
        backorder_hold_days: settings.backorder_hold_days,
      });
      setSettings(data);
      setSavedSettings(data);
      setMessage({ text: 'Parts settings saved.' });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'Failed to save parts settings.',
        error: true,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-12 w-12" /></div>;
  if (!settings) return <p className="p-6 text-destructive">Unable to load parts settings.</p>;

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-lg bg-[var(--bg-light-primary)] p-4 text-[var(--text-dark-primary)] md:p-6">
        <h1 className="text-2xl font-bold">Parts Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">
          Set the customer markup and flat shipping charged at parts checkout.
        </p>

        {message && (
          <Alert variant={message.error ? 'destructive' : 'default'} className="mt-5">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <PartsSettingsForm settings={settings} onChange={handleChange} />

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--text-dark-secondary)]">
            Changes apply to new checkouts immediately.
          </p>
          <Button onClick={save} disabled={!settingsAreDirty(settings, savedSettings) || saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}

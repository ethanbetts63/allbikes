'use client';

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';

import { authedFetch } from '@/lib/apiClient';
import type { ServiceSettings } from '@/types/ServiceSettings';
import ServiceSettingsForm from '@/app/dashboard/service-settings/_components/ServiceSettingsForm';

export default function ServiceSettingsPage() {
  const [settings, setSettings] = useState<ServiceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    authedFetch('/api/service/service-settings/')
      .then((response) => response.json())
      .then((data) => { if (!cancelled) setSettings(data); })
      .catch((err) => {
        if (cancelled) return;
        setError('Failed to fetch service settings.');
        console.error(err);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!settings) return;
    const { name, value, type } = e.target;
    setSettings({ ...settings, [name]: type === 'number' ? parseInt(value, 10) : value });
  };

  const setField = <K extends keyof ServiceSettings>(name: K, value: ServiceSettings[K]) => {
    setSettings(prev => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setLoading(true);
    setSuccessMessage(null);
    setError(null);

    try {
      const response = await authedFetch('/api/service/service-settings/', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      setSettings(data);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to save settings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) return <p>Loading settings...</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!settings) return <p>No settings found.</p>;

  return (
    <div className="p-4 md:p-6">
      <ServiceSettingsForm
        settings={settings}
        loading={loading}
        successMessage={successMessage}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        setField={setField}
      />
    </div>
  );
}

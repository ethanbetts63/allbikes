import React, { useState, useEffect } from 'react';
import { authedFetch } from '@/apiClient';
import type { ServiceSettings } from '@/types';
import ServiceSettingsForm from '@/forms/ServiceSettingsForm';

const ServiceSettingsPage = () => {
    const [settings, setSettings] = useState<ServiceSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await authedFetch('/api/service/service-settings/');
                const data = await response.json();
                setSettings(data);
            } catch (err) {
                setError('Failed to fetch service settings.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!settings) return;
        const { name, value, type } = e.target;
        setSettings({ ...settings, [name]: type === 'number' ? parseInt(value, 10) : value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setLoading(true);
        setSuccessMessage(null);
        setError(null);

        try {
            const response = await authedFetch(`/api/service/service-settings/`, {
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

    if (loading && !settings) {
        return <p>Loading settings...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (!settings) {
        return <p>No settings found.</p>;
    }

    return (
        <ServiceSettingsForm
            settings={settings}
            loading={loading}
            successMessage={successMessage}
            handleSubmit={handleSubmit}
            handleChange={handleChange}
        />
    );
};

export default ServiceSettingsPage;

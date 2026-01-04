import React, { useState, useEffect } from 'react';
import { authedFetch } from '@/apiClient';
import type { SiteSettings } from '@/types';
import SiteSettingsForm from '@/forms/SiteSettingsForm';

const SiteSettingsPage = () => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await authedFetch('/api/data/settings/');
                const data = await response.json();
                setSettings(data);
            } catch (err) {
                setError('Failed to fetch site settings.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!settings) return;
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setSettings({ ...settings, [name]: checked });
        } else {
            setSettings({ ...settings, [name]: value });
        }
    };
    
    const handleSwitchChange = (checked: boolean, name: string) => {
        if (!settings) return;
        setSettings({ ...settings, [name]: checked });
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setLoading(true);
        setSuccessMessage(null);
        setError(null);

        try {
            const response = await authedFetch(`/api/data/settings/`, {
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
        <SiteSettingsForm
            settings={settings}
            loading={loading}
            successMessage={successMessage}
            handleSubmit={handleSubmit}
            handleChange={handleChange}
            handleSwitchChange={handleSwitchChange}
        />
    );
};

export default SiteSettingsPage;
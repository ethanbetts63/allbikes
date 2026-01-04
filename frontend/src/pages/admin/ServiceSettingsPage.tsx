import React, { useState, useEffect } from 'react';
import { authedFetch } from '@/apiClient';
import type { ServiceSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Service Settings</h1>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
            
            {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Booking Configuration</CardTitle>
                        <CardDescription>Settings related to customer bookings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="booking_advance_notice">Booking Advance Notice (Days)</Label>
                            <Input 
                                id="booking_advance_notice" 
                                name="booking_advance_notice" 
                                type="number" 
                                value={settings.booking_advance_notice} 
                                onChange={handleChange} 
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Drop-Off Times</CardTitle>
                        <CardDescription>The hours during which customers can drop off their vehicles.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div>
                            <Label htmlFor="drop_off_start_time">Drop-off Start Time</Label>
                            <Input 
                                id="drop_off_start_time" 
                                name="drop_off_start_time" 
                                type="time" 
                                value={settings.drop_off_start_time} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div>
                            <Label htmlFor="drop_off_end_time">Drop-off End Time</Label>
                            <Input 
                                id="drop_off_end_time" 
                                name="drop_off_end_time" 
                                type="time" 
                                value={settings.drop_off_end_time} 
                                onChange={handleChange} 
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
};

export default ServiceSettingsPage;

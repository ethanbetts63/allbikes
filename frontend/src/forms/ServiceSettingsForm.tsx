import React from 'react';
import type { ServiceSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ServiceSettingsFormProps {
    settings: ServiceSettings;
    loading: boolean;
    successMessage: string | null;
    handleSubmit: (e: React.FormEvent) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ServiceSettingsForm: React.FC<ServiceSettingsFormProps> = ({
    settings,
    loading,
    successMessage,
    handleSubmit,
    handleChange,
}) => {
    return (
        <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">Service Settings</h1>
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
                            <Label htmlFor="booking_advance_notice" className="block mb-2">Booking Advance Notice (Days)</Label>
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
                            <Label htmlFor="drop_off_start_time" className="block mb-2">Drop-off Start Time</Label>
                            <Input 
                                id="drop_off_start_time" 
                                name="drop_off_start_time" 
                                type="time" 
                                value={settings.drop_off_start_time} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div>
                            <Label htmlFor="drop_off_end_time" className="block mb-2">Drop-off End Time</Label>
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

export default ServiceSettingsForm;

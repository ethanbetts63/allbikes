import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import type React from 'react';
import type { ServiceSettings } from '@/types/ServiceSettings';

interface ServiceSettingsFormProps {
  settings: ServiceSettings;
  loading: boolean;
  successMessage: string | null;
  handleSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setField: <K extends keyof ServiceSettings>(name: K, value: ServiceSettings[K]) => void;
}

const WEEKDAYS = [
    { value: 0, label: 'Mon' },
    { value: 1, label: 'Tue' },
    { value: 2, label: 'Wed' },
    { value: 3, label: 'Thu' },
    { value: 4, label: 'Fri' },
    { value: 5, label: 'Sat' },
    { value: 6, label: 'Sun' },
];

const parseWeekdays = (csv: string): Set<number> => {
    const set = new Set<number>();
    (csv || '').split(',').forEach(p => {
        const n = parseInt(p.trim(), 10);
        if (!Number.isNaN(n)) set.add(n);
    });
    return set;
};

const ServiceSettingsForm = ({
    settings,
    loading,
    successMessage,
    handleSubmit,
    handleChange,
    setField,
}: ServiceSettingsFormProps) => {
    const selectedWeekdays = parseWeekdays(settings.always_blocked_weekdays);

    const toggleWeekday = (value: number) => {
        const next = new Set(selectedWeekdays);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        setField('always_blocked_weekdays', Array.from(next).sort((a, b) => a - b).join(','));
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-[var(--text-dark-primary)]">Service Settings</h1>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
            
            {successMessage && <div className="bg-green-100 border border-green-400 text-highlight1 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}

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

                {/* Blocked Days */}
                <Card>
                    <CardHeader>
                        <CardTitle>Blocked Days</CardTitle>
                        <CardDescription>How unavailable days are determined for the public booking form.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <Label className="block mb-1">Use MechanicDesk blocked dates</Label>
                                <p className="text-xs text-[var(--text-dark-secondary)]">
                                    When on, unavailable days come from MechanicDesk. Turn off to use the rules below.
                                </p>
                            </div>
                            <Switch
                                checked={settings.use_mechanic_desk_blocked_dates}
                                onCheckedChange={v => setField('use_mechanic_desk_blocked_dates', v)}
                            />
                        </div>

                        <div className={settings.use_mechanic_desk_blocked_dates ? 'opacity-50 pointer-events-none' : ''}>
                            <Label className="block mb-2">Weekdays always closed</Label>
                            <div className="flex flex-wrap gap-2">
                                {WEEKDAYS.map(d => {
                                    const active = selectedWeekdays.has(d.value);
                                    return (
                                        <button
                                            key={d.value}
                                            type="button"
                                            onClick={() => toggleWeekday(d.value)}
                                            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                                                active
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'bg-transparent text-[var(--text-dark-primary)] border-input hover:bg-gray-100'
                                            }`}
                                        >
                                            {d.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-[var(--text-dark-secondary)] mt-2">
                                Minimum advance notice is controlled by &ldquo;Booking Advance Notice&rdquo; above. Block one-off dates by
                                clicking a day in the Service Diary.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Reminder Emails */}
                <Card>
                    <CardHeader>
                        <CardTitle>Reminder Emails</CardTitle>
                        <CardDescription>Automated reminders sent to customers before their drop-off.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <Label className="block mb-1">Send reminder emails</Label>
                                <p className="text-xs text-[var(--text-dark-secondary)]">
                                    Keep off while MechanicDesk is still sending its own reminders, to avoid duplicates.
                                </p>
                            </div>
                            <Switch
                                checked={settings.reminder_emails_enabled}
                                onCheckedChange={v => setField('reminder_emails_enabled', v)}
                            />
                        </div>
                        <div className={settings.reminder_emails_enabled ? '' : 'opacity-50 pointer-events-none'}>
                            <Label htmlFor="reminder_days_before" className="block mb-2">Days before drop-off</Label>
                            <Input
                                id="reminder_days_before"
                                name="reminder_days_before"
                                type="number"
                                min={0}
                                value={settings.reminder_days_before}
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

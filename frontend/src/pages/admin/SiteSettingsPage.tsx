import React, { useState, useEffect } from 'react';
import { authedFetch } from '@/apiClient';
import type { SiteSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Site Settings</h1>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
            
            {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1 */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>General</CardTitle>
                            <CardDescription>Basic site-wide feature toggles.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="enable_motorcycle_mover">Enable Motorcycle Mover</Label>
                                <Switch
                                    id="enable_motorcycle_mover"
                                    name="enable_motorcycle_mover"
                                    checked={settings.enable_motorcycle_mover}
                                    onCheckedChange={(checked) => handleSwitchChange(checked, 'enable_motorcycle_mover')}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="enable_banner">Enable Announcement Banner</Label>
                                <Switch
                                    id="enable_banner"
                                    name="enable_banner"
                                    checked={settings.enable_banner}
                                    onCheckedChange={(checked) => handleSwitchChange(checked, 'enable_banner')}
                                />
                            </div>
                            <div>
                                <Label htmlFor="banner_text">Banner Text</Label>
                                <Textarea
                                    id="banner_text"
                                    name="banner_text"
                                    value={settings.banner_text}
                                    onChange={handleChange}
                                />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>How customers can reach you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div>
                                <Label htmlFor="phone_number">Phone Number</Label>
                                <Input id="phone_number" name="phone_number" value={settings.phone_number} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="email_address">Email Address</Label>
                                <Input id="email_address" name="email_address" type="email" value={settings.email_address} onChange={handleChange} />
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Business Details</CardTitle>
                            <CardDescription>Official business numbers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="mrb_number">MRB Number</Label>
                                <Input id="mrb_number" name="mrb_number" value={settings.mrb_number} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="abn_number">ABN</Label>
                                <Input id="abn_number" name="abn_number" value={settings.abn_number} onChange={handleChange} />
                            </div>
                             <div>
                                <Label htmlFor="md_number">Motor Dealer Number</Label>
                                <Input id="md_number" name="md_number" value={settings.md_number} onChange={handleChange} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 2 */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Address</CardTitle>
                             <CardDescription>Physical storefront location.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="street_address">Street Address</Label>
                                <Input id="street_address" name="street_address" value={settings.street_address} onChange={handleChange} />
                            </div>
                             <div>
                                <Label htmlFor="address_locality">Suburb/City</Label>
                                <Input id="address_locality" name="address_locality" value={settings.address_locality} onChange={handleChange} />
                            </div>
                             <div>
                                <Label htmlFor="address_region">State/Region</Label>
                                <Input id="address_region" name="address_region" value={settings.address_region} onChange={handleChange} />
                            </div>
                             <div>
                                <Label htmlFor="postal_code">Postal Code</Label>
                                <Input id="postal_code" name="postal_code" value={settings.postal_code} onChange={handleChange} />
                            </div>
                             <div>
                                <Label htmlFor="google_places_place_id">Google Place ID</Label>
                                <Input id="google_places_place_id" name="google_places_place_id" value={settings.google_places_place_id} onChange={handleChange} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Media</CardTitle>
                            <CardDescription>Links to social media profiles.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="youtube_link">YouTube URL</Label>
                                <Input id="youtube_link" name="youtube_link" value={settings.youtube_link} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="instagram_link">Instagram URL</Label>
                                <Input id="instagram_link" name="instagram_link" value={settings.instagram_link} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="facebook_link">Facebook URL</Label>
                                <Input id="facebook_link" name="facebook_link" value={settings.facebook_link} onChange={handleChange} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Column 3 */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Opening Hours</CardTitle>
                            <CardDescription>Enter times or "Closed".</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div>
                                <Label htmlFor="opening_hours_monday">Monday</Label>
                                <Input id="opening_hours_monday" name="opening_hours_monday" value={settings.opening_hours_monday} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="opening_hours_tuesday">Tuesday</Label>
                                <Input id="opening_hours_tuesday" name="opening_hours_tuesday" value={settings.opening_hours_tuesday} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="opening_hours_wednesday">Wednesday</Label>
                                <Input id="opening_hours_wednesday" name="opening_hours_wednesday" value={settings.opening_hours_wednesday} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="opening_hours_thursday">Thursday</Label>
                                <Input id="opening_hours_thursday" name="opening_hours_thursday" value={settings.opening_hours_thursday} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="opening_hours_friday">Friday</Label>
                                <Input id="opening_hours_friday" name="opening_hours_friday" value={settings.opening_hours_friday} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="opening_hours_saturday">Saturday</Label>
                                <Input id="opening_hours_saturday" name="opening_hours_saturday" value={settings.opening_hours_saturday} onChange={handleChange} />
                            </div>
                            <div>
                                <Label htmlFor="opening_hours_sunday">Sunday</Label>
                                <Input id="opening_hours_sunday" name="opening_hours_sunday" value={settings.opening_hours_sunday} onChange={handleChange} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    );
};

export default SiteSettingsPage;
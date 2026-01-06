import React from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

const ContactDetails: React.FC = () => {
    const { settings, loading } = useSiteSettings();

    if (loading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Spinner />
            </div>
        );
    }

    if (!settings) {
        return (
             <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load contact information. Please try again later.</AlertDescription>
                </Alert>
            </div>
        );
    }
    
    const fullAddress = `${settings.street_address}\n${settings.address_locality}, ${settings.address_region} ${settings.postal_code}`;


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Our Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-2 whitespace-pre-line">{fullAddress}</p>
                        <p className="mb-2"><strong>Phone:</strong> {settings.phone_number}</p>
                        <p><strong>Email:</strong> <a href={`mailto:${settings.email_address}`} className="text-primary hover:underline">{settings.email_address}</a></p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Opening Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li><strong>Monday:</strong> {settings.opening_hours_monday || 'N/A'}</li>
                            <li><strong>Tuesday:</strong> {settings.opening_hours_tuesday || 'N/A'}</li>
                            <li><strong>Wednesday:</strong> {settings.opening_hours_wednesday || 'N/A'}</li>
                            <li><strong>Thursday:</strong> {settings.opening_hours_thursday || 'N/A'}</li>
                            <li><strong>Friday:</strong> {settings.opening_hours_friday || 'N/A'}</li>
                            <li><strong>Saturday:</strong> {settings.opening_hours_saturday || 'N/A'}</li>
                            <li><strong>Sunday:</strong> {settings.opening_hours_sunday || 'N/A'}</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ContactDetails;

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const backupContactDetails = {
    id: 0, // Placeholder ID
    enable_motorcycle_mover: false,
    enable_banner: false,
    banner_text: "",
    phone_number: "94334613",
    mobile_number: "0477700005",
    email_address: "admin@scootershop.com.au",
    street_address: "Unit 5 / 6 Cleveland Street",
    address_locality: "Dianella",
    address_region: "WA",
    postal_code: "6059",
    google_places_place_id: "",
    mrb_number: "",
    abn_number: "",
    md_number: "",
    youtube_link: "",
    instagram_link: "",
    facebook_link: "",
    opening_hours_monday: "9:00 AM - 5:00 PM",
    opening_hours_tuesday: "9:00 AM - 5:00 PM",
    opening_hours_wednesday: "9:00 AM - 5:00 PM",
    opening_hours_thursday: "9:00 AM - 5:00 PM",
    opening_hours_friday: "9:00 AM - 5:00 PM",
    opening_hours_saturday: "Closed",
    opening_hours_sunday: "Closed",
    last_updated: new Date().toISOString(), // Placeholder for last updated
};

const ContactDetails: React.FC = () => {
    const currentSettings = backupContactDetails;

    const fullAddress = `${currentSettings.street_address}\n${currentSettings.address_locality}, ${currentSettings.address_region} ${currentSettings.postal_code}`;


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-2xl">
                            <MapPin className="mr-2 h-6 w-6" /> Our Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 whitespace-pre-line">{fullAddress}</p>
                        {(() => {
                            const phoneNumber = currentSettings.phone_number;
                            const mobileNumber = currentSettings.mobile_number;
                            let displayedPhoneNumbers = '';
                            let primaryPhoneNumber = '';

                            if (phoneNumber && mobileNumber) {
                                displayedPhoneNumbers = `${phoneNumber} / ${mobileNumber}`;
                                primaryPhoneNumber = phoneNumber;
                            } else if (phoneNumber) {
                                displayedPhoneNumbers = phoneNumber;
                                primaryPhoneNumber = phoneNumber;
                            } else if (mobileNumber) {
                                displayedPhoneNumbers = mobileNumber;
                                primaryPhoneNumber = mobileNumber;
                            }

                            if (displayedPhoneNumbers) {
                                return (
                                    <div className="flex items-center mb-2">
                                        <Phone className="mr-2 h-5 w-5" />
                                        <a href={`tel:${primaryPhoneNumber}`} className="hover:underline">
                                            <span>{displayedPhoneNumbers}</span>
                                        </a>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                        <div className="flex items-center">
                            <Mail className="mr-2 h-5 w-5" />
                            <a href={`mailto:${currentSettings.email_address}`} className="text-primary hover:underline">{currentSettings.email_address}</a>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-2xl">
                            <Clock className="mr-2 h-6 w-6" /> Opening Hours
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li><strong>Monday:</strong> {currentSettings.opening_hours_monday || 'N/A'}</li>
                            <li><strong>Tuesday:</strong> {currentSettings.opening_hours_tuesday || 'N/A'}</li>
                            <li><strong>Wednesday:</strong> {currentSettings.opening_hours_wednesday || 'N/A'}</li>
                            <li><strong>Thursday:</strong> {currentSettings.opening_hours_thursday || 'N/A'}</li>
                            <li><strong>Friday:</strong> {currentSettings.opening_hours_friday || 'N/A'}</li>
                            <li><strong>Saturday:</strong> {currentSettings.opening_hours_saturday || 'N/A'}</li>
                            <li><strong>Sunday:</strong> {currentSettings.opening_hours_sunday || 'N/A'}</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ContactDetails;

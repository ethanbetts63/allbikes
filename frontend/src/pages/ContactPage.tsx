import React from 'react';
import Hero from '../components/Hero';
import ContactDetails from '../components/ContactDetails';
import SymImage from '@/assets/sym_22.webp';
import { Button } from '@/components/ui/button';
import { Phone, Mail } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';


const ContactPage: React.FC = () => {
    const { settings } = useSiteSettings();
    const description = "Our Perth workshop is your one-stop shop for motorcycle and scooter servicing and tyre fitting. Our experienced mechanics are here to help you with anything you need. We are located in Dianella, just a short ride from the city.";

    return (
        <div>
            <Hero
                title="Contact Us"
                description={description}
                imageUrl={SymImage}
            />
            
            {settings && (
                <div className="bg-background py-0">
                    <div className="container mx-auto flex flex-col items-center justify-center text-center">
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
                            <a href={`tel:${settings.phone_number}`} className="hidden sm:block">
                                <Button size="lg">
                                    <Phone className="mr-2 h-6 w-6" />
                                    Call Us ({settings.phone_number})
                                </Button>
                            </a>
                             <a href={`tel:${settings.phone_number}`} className="sm:hidden">
                                <Button size="lg">
                                    <Phone className="mr-2 h-6 w-6" />
                                    Call Us
                                </Button>
                            </a>
                            <a href={`mailto:${settings.email_address}?`} target="_blank" rel="noopener noreferrer">
                                <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                                    <Mail className="mr-2 h-6 w-6" />
                                    Email Us
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <ContactDetails />
        </div>
    );
};

export default ContactPage;


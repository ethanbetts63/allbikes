import React from 'react';
import Hero from '../components/Hero';
import ContactDetails from '../components/ContactDetails';
import SymImage from '@/assets/sym_22.webp';
import { Button } from '@/components/ui/button';
import { Phone, Mail } from 'lucide-react';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import OtherSites from '../components/OtherSites';
import Breadcrumb from '../components/Breadcrumb';
import Seo from '@/components/Seo';

const otherSitesData = [
    {
        name: "Splitcart",
        logoSrc: "/src/assets/splitcart_logo.png", 
        description: "Compare grocery prices across major Australian supermarkets.",
        url: "https://www.splitcart.com.au", 
    },
    {
        name: "Future Reminder",
        logoSrc: "/src/assets/futurereminder_logo.png", 
        description: "Never miss an important event with our persistent reminder service.",
        url: "https://www.futurereminder.app", 
    },
];

const ContactPage: React.FC = () => {
    const { settings } = useSiteSettings();
    const description = "Our Perth workshop is your one-stop shop for motorcycle and scooter servicing and tyre fitting. Our experienced mechanics are here to help you with anything you need. We are located in Dianella, just a short ride from the city.";

    const breadcrumbItems = [
        { name: 'Home', href: '/' },
        { name: 'Contact Us', href: '/contact' }
    ];

    return (
        <div>
            <Seo
                title="Contact Us | Allbikes"
                description={description}
                canonicalPath="/contact"
            />
            <Hero
                title="Contact Us"
                description={description}
                imageUrl={SymImage}
            />
            <Breadcrumb items={breadcrumbItems} />
            
            {settings && (
                <div className="bg-background py-0">
                    <div className="container mx-auto flex flex-col items-center justify-center text-center">
                        <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-6">
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
                                    Email Us ({settings.email_address})
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            <ContactDetails />

            <OtherSites sites={otherSitesData} />
        </div>
    );
};

export default ContactPage;

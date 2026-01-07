import React from 'react';
import Hero from '../components/Hero';
import ContactDetails from '../components/ContactDetails';
import SymImage from '@/assets/sym_22.webp';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import OtherSites from '../components/OtherSites';
import Breadcrumb from '../components/Breadcrumb';
import Seo from '@/components/Seo';
import ContactButtons from '@/components/ContactButtons';
import splitcartLogo from "/src/assets/splitcart_logo.png";
import futureReminderLogo from "/src/assets/futurereminder_logo.png";

const otherSitesData = [
    {
        name: "Splitcart",
        logoSrc: splitcartLogo, 
        description: "Compare grocery prices across major Australian supermarkets.",
        url: "https://www.splitcart.com.au", 
    },
    {
        name: "Future Reminder",
        logoSrc: futureReminderLogo, 
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
                <ContactButtons 
                    phoneNumber={settings.phone_number} 
                    emailAddress={settings.email_address} 
                />
            )}

            <ContactDetails />

            <OtherSites sites={otherSitesData} />
        </div>
    );
};

export default ContactPage;

import Hero from '../components/Hero';
import ContactDetails from '../components/ContactDetails';
import SymImage from '@/assets/sym_22.webp';
import { siteSettings } from '@/config/siteSettings';
import OtherSites from '../components/OtherSites';
import Breadcrumb from '../components/Breadcrumb';
import Seo from '@/components/Seo';
import ContactButtons from '@/components/ContactButtons';
import splitcartLogo from "/src/assets/splitcart_logo.png";
import futureReminderLogo from "/src/assets/futurereminder_logo.png";
import foreverFlowerLogo from "/src/assets/foreverflower_logo.png";
import { FaqSection } from '@/components/FaqSection';

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
    {
        name: "FutureFlower",
        logoSrc: foreverFlowerLogo, 
        description: "Flower delivery and subscription service.",
        url: "https://www.futureflower.app", 
    },
];

const faqData = [
    {
      "question": "How can I contact you?",
      "answer": `You can contact us by phone on ${siteSettings.phone_number || '{phone}'}, by email at ${siteSettings.email_address || '{email}'}, or via our Contact Us page.`
    },
    {
      "question": "What types of motorcycles and scooters do you service?",
      "answer": "We service almost all motorcycles and scooters."
    },
    {
      "question": "What areas of Perth do you service?",
      "answer": `Our workshop is based in Dianella at ${siteSettings.street_address || '{address}'}. If you are looking for "motorcycle mechanics near me" or "scooter mechanics near me", Allbikes & Scooters frequently services the areas of Dianella, Morley, Fremantle, Yokine, CBD, Menora, Cottesloe, Mount Lawley, North Perth, Northbridge, Inglewood and many other Perth suburbs. If you are more distant, or are unable to move your bike, we work closely with and can recommend Perth Motorcycle and Scooter Movers. More information is available on our service page.`
    },
    {
      "question": "Do you service electric motorcycles and scooters?",
      "answer": "Yes, we service electric motorcycles and electric mopeds."
    }
  ];
const ContactPage = () => {
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
            
            {siteSettings && (
                <ContactButtons 
                    phoneNumber={siteSettings.phone_number} 
                    emailAddress={siteSettings.email_address} 
                />
            )}

            <ContactDetails />

            <FaqSection title="Frequently Asked Questions" faqData={faqData} />

            <OtherSites sites={otherSitesData} />

        </div>
    );
};

export default ContactPage;

import Hero from '../components/Hero';
import ContactDetails from '../components/ContactDetails';
import SymImage from '@/assets/sym_22.webp';
import { siteSettings } from '@/config/siteSettings';
import ContactButtons from '@/components/ContactButtons';
import splitcartLogo from "@/assets/splitcart_logo.png";
import futureFlowerLogo from "@/assets/futureflower_logo.png";
import DeferredContactSections from '@/components/DeferredContactSections';
import { contactFaqData } from '@/data/contactFaqs';

const otherSitesData = [
    {
        name: "Splitcart",
        logoSrc: splitcartLogo.src,
        description: "Compare grocery prices across major Australian supermarkets.",
        url: "https://www.splitcart.com.au",
    },
    {
        name: "FutureFlower",
        logoSrc: futureFlowerLogo.src,
        description: "Flower delivery and subscription service.",
        url: "https://www.futureflower.app", 
    },
];

const ContactPage = () => {
    const description = "Our Perth workshop is your one-stop shop for motorcycle and scooter servicing and tyre fitting. Our experienced mechanics are here to help you with anything you need. We are located in Dianella, just a short ride from the city.";

    return (
        <div>
            <Hero
                title="Contact Us"
                description={description}
                image={SymImage}
            />
            {siteSettings && (
                <ContactButtons
                    phoneNumber={siteSettings.phone_number}
                    mobileNumber={siteSettings.mobile_number}
                    emailAddress={siteSettings.email_address}
                />
            )}

            <ContactDetails />

            <DeferredContactSections faqData={contactFaqData} otherSites={otherSitesData} />

        </div>
    );
};

export default ContactPage;

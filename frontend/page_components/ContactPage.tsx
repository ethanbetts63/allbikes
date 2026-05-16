import Hero from '../components/Hero';
import ContactDetails from '../components/ContactDetails';
import SymImage from '@/assets/sym_22.webp';
import SymImage320 from '@/assets/sym_22-320w.webp';
import SymImage640 from '@/assets/sym_22-640w.webp';
import SymImage768 from '@/assets/sym_22-768w.webp';
import SymImage1024 from '@/assets/sym_22-1024w.webp';
import SymImage1280 from '@/assets/sym_22-1280w.webp';
import { siteSettings } from '@/config/siteSettings';
import ContactButtons from '@/components/ContactButtons';
import splitcartLogo from "@/assets/splitcart_logo.png";
import futureFlowerLogo from "@/assets/futureflower_logo.png";
import DeferredContactSections from '@/components/DeferredContactSections';
import { contactFaqData } from '@/data/contactFaqs';

const symSrcSet = `${SymImage320.src} 320w, ${SymImage640.src} 640w, ${SymImage768.src} 768w, ${SymImage1024.src} 1024w, ${SymImage1280.src} 1280w`;

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
                imageUrl={SymImage.src}
                imageSrcSet={symSrcSet}
                imageSizes="100vw"
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

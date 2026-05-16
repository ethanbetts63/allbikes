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
      "answer": `Our workshop is based in Dianella at ${siteSettings.street_address || '{address}'}. If you are looking for "motorcycle mechanics near me" or "scooter mechanics near me", ScooterShop frequently services the areas of Dianella, Morley, Fremantle, Yokine, CBD, Menora, Cottesloe, Mount Lawley, North Perth, Northbridge, Inglewood and many other Perth suburbs. If you are more distant, or are unable to move your bike, we work closely with and can recommend Perth Motorcycle and Scooter Movers. More information is available on our service page.`
    },
    {
      "question": "Do you service electric motorcycles and scooters?",
      "answer": "Yes, we service electric motorcycles and electric mopeds."
    }
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

            <DeferredContactSections faqData={faqData} otherSites={otherSitesData} />

        </div>
    );
};

export default ContactPage;

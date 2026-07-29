import Hero from '@/components/Hero';
import ContactDetails from '@/app/contact/_components/ContactDetails';
import SymImage from '@/assets/sym_22.webp';
import { siteSettings } from '@/lib/siteSettings';
import ContactButtons from '@/app/contact/_components/ContactButtons';
import splitcartLogo from "@/assets/splitcart_logo.png";
import futureFlowerLogo from "@/assets/futureflower_logo.png";
import DeferredContactSections from '@/app/contact/_components/DeferredContactSections';
import { contactFaqData } from '@/app/contact/_lib/contactFaqs';
import StructuredDataScript from '@/components/StructuredDataScript';
import { buildFaqSchema, buildLocalBusinessSchema, buildContactPageSchema, buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Contact Motorcycle & Scooter Workshop Perth',
  description: 'Contact the Dianella workshop for motorcycle and scooter sales, servicing, tyre fitting, hire, and general enquiries.',
  canonicalPath: '/contact',
});

const structuredData = [
  buildLocalBusinessSchema(siteSettings),
  buildContactPageSchema(),
  buildFaqSchema(contactFaqData),
].filter(Boolean) as object[];

export default function Page() {
  return (
    <>
      <StructuredDataScript structuredData={structuredData} />
      <ContactPage />
    </>
  );
}

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

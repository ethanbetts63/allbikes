import StructuredDataScript from '@/components/StructuredDataScript';
import HomeHeroV2 from '@/components/HomeHeroV2';
import ReviewCarousel from "@/components/ReviewCarousel";
import BrandsSection from '@/components/BrandsSection';
import FeaturedBikes from '@/components/FeaturedBikesLazy';
import { FaqSection } from '@/components/FaqSection';
import type { Bike } from "@/types/Bike";
import type { Product } from "@/types/Product";
import { siteSettings } from '@/config/siteSettings';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import ServiceCTAV2 from '@/components/ServiceCTAV2';
import FeaturedEScooters from '@/components/FeaturedEScooters';
import PayLaterSection from '@/components/PayLaterSection';
import HireCTASection from '@/components/HireCTASection';
import { buildLocalBusinessSchema, buildWebsiteSchema, buildFaqSchema } from '@/lib/seo';

interface HomePageProps {
  initialNewBikes?: Bike[];
  initialUsedBikes?: Bike[];
  initialFeaturedProducts?: Product[];
}

const HomePage = ({
  initialNewBikes,
  initialUsedBikes,
  initialFeaturedProducts,
}: HomePageProps) => {
  const newBikes = initialNewBikes ?? [];
  const usedBikes = initialUsedBikes ?? [];
  const featuredProducts = initialFeaturedProducts ?? [];

  const faqData = [
    {
      "question": "How can I contact you?",
      "answer": `You can contact us by phone on ${siteSettings.phone_number || '{phone}'}, by email at ${siteSettings.email_address || '{email}'}, or via our Contact Us page.`
    },
    {
      "question": "What types of motorcycles and scooters do you service?",
      "answer": "We service all motorcycles and scooters. For scooters, we specialise in Italian brands and mid to upper-end Asian brands but we regularly and happily service all kinds of bikes."
    },
    {
      "question": "What areas of Perth do you service?",
      "answer": `Our workshop is based in Dianella at ${siteSettings.street_address || '{address}'}. If you are looking for "motorcycle mechanics near me" or "scooter mechanics near me", ScooterShop frequently services the areas of Dianella, Morley, Fremantle, Yokine, CBD, Menora, Cottesloe, Mount Lawley, North Perth, Northbridge, Inglewood and many other Perth suburbs. If you are more distant, or are unable to move your bike, we work closely with and can recommend Perth Motorcycle and Scooter Movers. More information is available on our service page.`
    },
    {
      "question": "Do you service electric motorcycles and scooters?",
      "answer": "Yes, we service electric motorcycles and electric mopeds."
    },
    {
      question: 'Do you sell electric scooters?',
      answer: 'Yes! We sell electric scooters (e-scooters) online with free delivery Australia-wide. Visit our E-Scooters page to browse our current range. All prices include GST.'
    }
  ];

  const structuredData = [
    buildLocalBusinessSchema(siteSettings),
    buildWebsiteSchema(),
    buildFaqSchema(faqData),
  ].filter(Boolean) as object[];


  return (
    <div>
      <StructuredDataScript structuredData={structuredData} />
        <HomeHeroV2
            newBikes={newBikes}
            usedBikes={usedBikes}
            error={null}
            phoneNumber={siteSettings.phone_number}
            mobileNumber={siteSettings.mobile_number}
            emailAddress={siteSettings.email_address}
        />
        <ReviewCarousel />
        

        {!siteSettings.hide_escooters && (
          <div className="defer-section">
            <FeaturedEScooters products={featuredProducts} />
          </div>
        )}
 

        

        <div className="defer-section-sm">
          <FeaturedBikes
            title="Featured New Scooters"
            bikes={newBikes}
            description="Check out some of our latest new models available now."
            linkTo="/inventory/scooters/new"
            linkText="All New Scooters"
          />
        </div>
        
        {siteSettings.show_hire && (
          <div className="defer-section-sm">
            <HireCTASection />
          </div>
        )}
        
        <div className="defer-section-sm">
          <FeaturedBikes
            title="Featured Used Bikes"
            bikes={usedBikes}
            description="Explore our range of quality pre-owned motorcycles and scooters."
            linkTo="/inventory/motorcycles/used"
            linkText="Browse Used Inventory"
          />
        </div>

        <div className="defer-section">
          <ServiceCTAV2 />
        </div>



        <div className="defer-section">
          <PayLaterSection />
        </div>

        <div className="defer-section-lg">
          <BrandsSection />
        </div>

        <div className="defer-section">
          <FaqSection title="Frequently Asked Questions" faqData={faqData} />
        </div>
        <FloatingActionButton /> 
    </div>
  );
};

export default HomePage;


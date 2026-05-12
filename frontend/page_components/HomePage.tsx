import StructuredDataScript from '@/components/StructuredDataScript';
import HomeHeroV2 from '@/components/HomeHeroV2';
import ReviewCarousel from "@/components/ReviewCarousel";
import BrandsSection from '@/components/BrandsSection';
import FeaturedBikes from '@/components/FeaturedBikes';
import { FaqSection } from '@/components/FaqSection';
import type { Bike } from "@/types/Bike";
import type { Product } from "@/types/Product";
import { siteSettings } from '@/config/siteSettings';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import ServiceCTAV2 from '@/components/ServiceCTAV2';
import FeaturedEScooters from '@/components/FeaturedEScooters';
import PayLaterSection from '@/components/PayLaterSection';
import HireCTASection from '@/components/HireCTASection';

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

  // Converts a local AU phone number to E.164 (required by schema.org)
  const toE164Au = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('61')) return `+${digits}`;
    if (digits.startsWith('0')) return `+61${digits.slice(1)}`;
    if (digits.length === 8) return `+618${digits}`; // Perth landline missing area code
    return `+61${digits}`;
  };

  // Converts "9:00 AM" / "5:00 PM" to ISO 24h "09:00" / "17:00"
  const to24h = (timeStr: string): string => {
    const match = timeStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)$/i);
    if (!match) return timeStr;
    let h = parseInt(match[1]);
    const m = match[2];
    const period = match[3].toUpperCase();
    if (period === 'AM' && h === 12) h = 0;
    if (period === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  const localBusinessSchema = siteSettings ? {
    "@context": "https://schema.org",
    "@type": ["MotorcycleDealer", "AutoDealer"],
    "@id": "https://www.scootershop.com.au/#business",
    "name": "ScooterShop",
    "image": "https://www.scootershop.com.au/logo-512x512.png",
    "url": "https://www.scootershop.com.au",
    "telephone": toE164Au(siteSettings.phone_number),
    "email": siteSettings.email_address,
    "founder": {
      "@type": "Person",
      "name": "Ethan Betts"
    },
    "address": {
        "@type": "PostalAddress",
        "streetAddress": siteSettings.street_address,
        "addressLocality": siteSettings.address_locality,
        "addressRegion": siteSettings.address_region,
        "postalCode": siteSettings.postal_code,
        "addressCountry": "AU"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": -31.90652137087452,
      "longitude": 115.88103847100608
    },
    "openingHoursSpecification": [
        { day: "Monday",    hours: siteSettings.opening_hours_monday },
        { day: "Tuesday",   hours: siteSettings.opening_hours_tuesday },
        { day: "Wednesday", hours: siteSettings.opening_hours_wednesday },
        { day: "Thursday",  hours: siteSettings.opening_hours_thursday },
        { day: "Friday",    hours: siteSettings.opening_hours_friday },
        { day: "Saturday",  hours: siteSettings.opening_hours_saturday },
        { day: "Sunday",    hours: siteSettings.opening_hours_sunday },
    ]
    .filter(({ hours }) => hours && !hours.toLowerCase().includes('closed'))
    .map(({ day, hours }) => ({
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": day,
        "opens": to24h(hours.split('-')[0].trim()),
        "closes": to24h(hours.split('-')[1].trim()),
    })),
    "priceRange": "$$",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "105",
      "bestRating": "5"
    }
} : null;

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ScooterShop",
    "url": "https://www.scootershop.com.au"
  };

  const structuredData = [];
  if (localBusinessSchema) {
      structuredData.push(localBusinessSchema);
  }
  structuredData.push(webSiteSchema);


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
            title={<>Featured <span className="hidden md:inline">New Motorcycles & Scooters</span><span className="md:hidden">New Bikes</span></>}
            bikes={newBikes}
            description="Check out some of our latest new models available now."
            linkTo="/inventory/motorcycles/new"
            linkText="All New Bikes"
          />
        </div>
        
        {siteSettings.show_hire && (
          <div className="defer-section-sm">
            <HireCTASection />
          </div>
        )}
        
        <div className="defer-section-sm">
          <FeaturedBikes
            title={<>Featured <span className="hidden md:inline">Used Motorcycles & Scooters</span><span className="md:hidden">Used Bikes</span></>}
            bikes={usedBikes}
            description="Explore our range of quality pre-owned motorcycles and scooters."
            linkTo="/inventory/motorcycles/used"
            linkText="All Used Bikes"
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


import { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import HomeHeroV2 from '@/components/HomeHeroV2';
import ReviewCarousel from "@/components/ReviewCarousel";
import BrandsSection from '@/components/BrandsSection';
import FeaturedBikes from '@/components/FeaturedBikes';
import { FaqSection } from '@/components/FaqSection';
import { getBikes, getProducts } from '@/api';
import type { Bike } from "@/types/Bike";
import type { Product } from "@/types/Product";
import { siteSettings } from '@/config/siteSettings';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import ServiceCTAV2 from '@/components/ServiceCTAV2';
import FeaturedEScooters from '@/components/FeaturedEScooters';
import PayLaterSection from '@/components/PayLaterSection';
import HireCTASection from '@/components/HireCTASection';

const HomePage = () => {
  const [newBikes, setNewBikes] = useState<Bike[]>([]);
  const [usedBikes, setUsedBikes] = useState<Bike[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const [newBikesResponse, usedBikesResponse, productsResponse] = await Promise.all([
          getBikes({ condition: 'new', page: 1, is_featured: true }),
          getBikes({ condition: 'used', page: 1, is_featured: true }),
          getProducts({ is_featured: true }),
        ]);

        const availableNewBikes = newBikesResponse.results.filter(
          bike => bike.status !== 'unavailable'
        );
        setNewBikes(availableNewBikes);

        const availableUsedBikes = usedBikesResponse.results.filter(
          bike => bike.status !== 'unavailable'
        );
        setUsedBikes(availableUsedBikes);

        setFeaturedProducts(productsResponse.results.slice(0, 2));

      } catch (err) {
        console.error("Failed to fetch page data:", err);
        setError("Failed to load page data.");
      }
    };

    fetchPageData();
  }, []);

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
      "answer": `Our workshop is based in Dianella at ${siteSettings.street_address || '{address}'}. If you are looking for "motorcycle mechanics near me" or "scooter mechanics near me", Allbikes & Scooters frequently services the areas of Dianella, Morley, Fremantle, Yokine, CBD, Menora, Cottesloe, Mount Lawley, North Perth, Northbridge, Inglewood and many other Perth suburbs. If you are more distant, or are unable to move your bike, we work closely with and can recommend Perth Motorcycle and Scooter Movers. More information is available on our service page.`
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

  const localBusinessSchema = siteSettings ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Allbikes & Scooters",
    "image": "https://www.scootershop.com.au/logo-512x512.png",
    "url": "https://www.scootershop.com.au",
    "telephone": siteSettings.phone_number,
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
        "opens": hours.split('-')[0].trim(),
        "closes": hours.split('-')[1].trim(),
    })),
    "priceRange": "AUD"
} : null;

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Allbikes & Scooters",
    "url": "https://www.scootershop.com.au"
  };

  const structuredData = [];
  if (localBusinessSchema) {
      structuredData.push(localBusinessSchema);
  }
  structuredData.push(webSiteSchema);


  return (
    <div>
      <Seo
        title="Motorcycles, Scooters & Electric Scooters Perth | ScooterShop"
        description="New and used motorcycles, scooters, and electric scooters for sale in Perth. Buy e-scooters online with free Australia-wide delivery. Servicing and tyre fitting also available."
        canonicalPath="/"
        structuredData={structuredData}
      />
        <HomeHeroV2
            newBikes={newBikes}
            usedBikes={usedBikes}
            error={error}
            phoneNumber={siteSettings.phone_number}
            mobileNumber={siteSettings.mobile_number}
            emailAddress={siteSettings.email_address}
        />
        <ReviewCarousel />
        

        {!siteSettings.hide_escooters && <FeaturedEScooters products={featuredProducts} />}
 

        

        <FeaturedBikes
          title={<>Featured <span className="hidden md:inline">New Motorcycles & Scooters</span><span className="md:hidden">New Bikes</span></>}
          bikes={newBikes}
          description="Check out some of our latest new models available now."
          linkTo="/inventory/motorcycles/new"
          linkText="All New Bikes"
        />
        
        {siteSettings.show_hire && <HireCTASection />}
        
        <FeaturedBikes
          title={<>Featured <span className="hidden md:inline">Used Motorcycles & Scooters</span><span className="md:hidden">Used Bikes</span></>}
          bikes={usedBikes}
          description="Explore our range of quality pre-owned motorcycles and scooters."
          linkTo="/inventory/motorcycles/used"
          linkText="All Used Bikes"
        />

        <ServiceCTAV2 />



        <PayLaterSection />

        <BrandsSection />

        <FaqSection title="Frequently Asked Questions" faqData={faqData} />
        <FloatingActionButton /> 
    </div>
  );
};

export default HomePage;


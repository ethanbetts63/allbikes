import { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import HomeHero from '@/components/HomeHero';
import ReviewCarousel from "@/components/ReviewCarousel";
import BrandsSection from '@/components/BrandsSection';
import FeaturedBikes from '@/components/FeaturedBikes';
import { FaqSection } from '@/components/FaqSection';
import { getBikes } from '@/api';
import type { Bike } from "@/types";
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { FloatingActionButton } from '@/components/FloatingActionButton';

const HomePage = () => {
  const [newBikes, setNewBikes] = useState<Bike[]>([]);
  const [usedBikes, setUsedBikes] = useState<Bike[]>([]);
  const { settings, loading: settingsLoading } = useSiteSettings();
  const [bikesLoading, setBikesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBikes = async () => {
      try {
        const [newBikesResponse, usedBikesResponse] = await Promise.all([
          getBikes({ condition: 'new', page: 1, is_featured: true }),
          getBikes({ condition: 'used', page: 1, is_featured: true })
        ]);

        const availableNewBikes = newBikesResponse.results.filter(
          bike => bike.status !== 'unavailable' && bike.status !== 'Unavailable'
        );
        setNewBikes(availableNewBikes);

        const availableUsedBikes = usedBikesResponse.results.filter(
          bike => bike.status !== 'unavailable' && bike.status !== 'Unavailable'
        );
        setUsedBikes(availableUsedBikes);

      } catch (err) {
        console.error("Failed to fetch page data:", err);
        setError("Failed to load page data.");
      } finally {
        setBikesLoading(false);
      }
    };

    fetchBikes();
  }, []);

  const faqData = [
    {
      "question": "How can I contact you?",
      "answer": `You can contact us by phone on ${settings?.phone_number || '{phone}'}, by email at ${settings?.email_address || '{email}'}, or via our Contact Us page.`
    },
    {
      "question": "What types of motorcycles and scooters do you service?",
      "answer": "We service all motorcycles and most scooters. For scooters, we specialise in Italian brands and mid to upper-end Asian brands. Some brands are excluded due to parts availability and build quality concerns, allowing us to maintain reliable, long-lasting repairs. Full details are listed on our service page."
    },
    {
      "question": "What areas of Perth do you service?",
      "answer": `Our workshop is based in Dianella at ${settings?.street_address || '{address}'}. While we service surrounding suburbs, many customers visit us from across Greater Perth. We can recommend a motorcycle mover service, so distance is not an issue. More information is available on our service page.`
    },
    {
      "question": "Do you service electric motorcycles and scooters?",
      "answer": "Yes, we service electric motorcycles and electric mopeds."
    },
    {
      "question": "Do you sell or service electric kick scooters?",
      "answer": "No. We sell and service electric mopeds and electric motorcycles, but we do not work on electric kick scooters. The term “electric scooter” is often used for both, despite being very different vehicles."
    }
  ];

  const localBusinessSchema = settings ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Allbikes Vespa Warehouse",
    "image": "https://www.allbikesvespawarehouse.com.au/logo-512x512.png", // Assuming this is the main logo
    "url": "https://www.allbikesvespawarehouse.com.au",
    "telephone": settings.phone_number,
    "email": settings.email_address,
    "address": {
        "@type": "PostalAddress",
        "streetAddress": settings.street_address,
        "addressLocality": settings.address_locality,
        "addressRegion": settings.address_region,
        "postalCode": settings.postal_code,
        "addressCountry": "AU" // Assuming Australia
    },
    "openingHoursSpecification": [
        settings.opening_hours_monday && {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Monday",
            "opens": settings.opening_hours_monday.split('-')[0],
            "closes": settings.opening_hours_monday.split('-')[1]
        },
        settings.opening_hours_tuesday && {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Tuesday",
            "opens": settings.opening_hours_tuesday.split('-')[0],
            "closes": settings.opening_hours_tuesday.split('-')[1]
        },
        settings.opening_hours_wednesday && {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Wednesday",
            "opens": settings.opening_hours_wednesday.split('-')[0],
            "closes": settings.opening_hours_wednesday.split('-')[1]
        },
        settings.opening_hours_thursday && {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Thursday",
            "opens": settings.opening_hours_thursday.split('-')[0],
            "closes": settings.opening_hours_thursday.split('-')[1]
        },
        settings.opening_hours_friday && {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Friday",
            "opens": settings.opening_hours_friday.split('-')[0],
            "closes": settings.opening_hours_friday.split('-')[1]
        },
        settings.opening_hours_saturday && {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Saturday",
            "opens": settings.opening_hours_saturday.split('-')[0],
            "closes": settings.opening_hours_saturday.split('-')[1]
        },
        settings.opening_hours_sunday && {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": "Sunday",
            "opens": settings.opening_hours_sunday.split('-')[0],
            "closes": settings.opening_hours_sunday.split('-')[1]
        },
    ].filter(Boolean), // Filter out any null/undefined entries if a day's hours are not set
    "priceRange": "AUD" // Placeholder, if no specific range is available.
} : null;

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Allbikes Vespa Warehouse",
    "url": "https://www.allbikesvespawarehouse.com.au",
    "potentialAction": {
        "@type": "SearchAction",
        "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://www.allbikesvespawarehouse.com.au/search?q={search_term_string}" // Assuming a search page at /search
        },
        "queryInput": "required name=search_term_string"
    }
  };

  const structuredData = [];
  if (localBusinessSchema) {
      structuredData.push(localBusinessSchema);
  }
  structuredData.push(webSiteSchema);


  return (
    <div>
      <Seo
        title="Allbikes Vespa Warehouse - Perth's Motorcycle and Scooter Dealership"
        description="Discover a wide range of new and used motorcycles and scooters at Allbikes. We offer sales, servicing, and expert advice for riders in Perth."
        canonicalPath="/"
        structuredData={structuredData}
      />
        <HomeHero 
            newBikes={newBikes} 
            usedBikes={usedBikes} 
            loading={bikesLoading || settingsLoading} 
            error={error} 
            phoneNumber={settings?.phone_number} // Pass phoneNumber
            emailAddress={settings?.email_address} // Pass emailAddress
        />
        <ReviewCarousel />
        <BrandsSection />
        <FeaturedBikes
          title={<>Featured <span className="hidden md:inline">New Motorcycles and Scooters</span><span className="md:hidden">New Bikes</span></>}
          bikes={newBikes}
          description="Check out some of our latest new models available now."
          linkTo="/inventory/motorcycles/new"
          linkText="All New Bikes"
        />
        <FeaturedBikes
          title={<>Featured <span className="hidden md:inline">Used Motorcycles and Scooters</span><span className="md:hidden">Used Bikes</span></>}
          bikes={usedBikes}
          description="Explore our range of quality pre-owned motorcycles and scooters."
          linkTo="/inventory/motorcycles/used"
          linkText="All Used Bikes"
        />
        <FaqSection title="Frequently Asked Questions" faqData={faqData} />
        <FloatingActionButton /> 
    </div>
  );
};

export default HomePage;


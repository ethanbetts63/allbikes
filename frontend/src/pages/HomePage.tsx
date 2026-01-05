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

  return (
    <div>
      <Seo
        title="Allbikes - Perth's Premier Motorcycle and Scooter Dealership"
        description="Discover a wide range of new and used motorcycles and scooters at Allbikes. We offer sales, servicing, and expert advice for riders in Perth."
        canonicalPath="/"
      />
        <HomeHero newBikes={newBikes} usedBikes={usedBikes} loading={bikesLoading || settingsLoading} error={error} />
        <ReviewCarousel />
        <BrandsSection />
        <FeaturedBikes
          title="Featured New Motorcycles and Scooters"
          bikes={newBikes}
          description="Check out some of our latest new models available now."
          linkTo="/bikes/new"
          linkText="All New Bikes"
        />
        <FeaturedBikes
          title="Featured Used Motorcycles and Scooters"
          bikes={usedBikes}
          description="Explore our range of quality pre-owned motorcycles and scooters."
          linkTo="/bikes/used"
          linkText="All Used Bikes"
        />
        <FaqSection title="Frequently Asked Questions" faqData={faqData} />
    </div>
  );
};

export default HomePage;

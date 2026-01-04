import { useState, useEffect } from 'react';
import HomeHero from '@/components/HomeHero';
import ReviewCarousel from "@/components/ReviewCarousel";
import BrandsSection from '@/components/BrandsSection';
import FeaturedBikes from '@/components/FeaturedBikes';
import { FaqSection } from '@/components/FaqSection';
import { getBikes, getFooterSettings } from '@/api';
import type { Bike, FooterSettings } from "@/types";

const HomePage = () => {
  const [newBikes, setNewBikes] = useState<Bike[]>([]);
  const [usedBikes, setUsedBikes] = useState<Bike[]>([]);
  const [siteSettings, setSiteSettings] = useState<FooterSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch settings and bikes in parallel
        const [settingsResponse, newBikesResponse, usedBikesResponse] = await Promise.all([
          getFooterSettings(),
          getBikes('new', 1, true),
          getBikes('used', 1, true)
        ]);

        setSiteSettings(settingsResponse);

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
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
        <HomeHero newBikes={newBikes} usedBikes={usedBikes} loading={loading} error={error} />
        <ReviewCarousel />
        <BrandsSection />
        <FeaturedBikes
          title="Featured New Bikes"
          bikes={newBikes}
          description="Check out some of our latest new models available now."
          linkTo="/bikes/new"
          linkText="All New Bikes"
        />
        <FeaturedBikes
          title="Featured Used Bikes"
          bikes={usedBikes}
          description="Explore our range of quality pre-owned motorcycles and scooters."
          linkTo="/bikes/used"
          linkText="All Used Bikes"
        />
        <FaqSection title="Frequently Asked Questions" siteSettings={siteSettings} />
    </div>
  );
};

export default HomePage;

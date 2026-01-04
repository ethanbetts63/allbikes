import { useState, useEffect } from 'react';
import HomeHero from '@/components/HomeHero';
import ReviewCarousel from "@/components/ReviewCarousel";
import BrandsSection from '@/components/BrandsSection';
import FeaturedBikes from '@/components/FeaturedBikes';
import { getBikes } from '@/api';
import type { Bike } from "@/types";

const HomePage = () => {
  const [newBikes, setNewBikes] = useState<Bike[]>([]);
  const [usedBikes, setUsedBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedBikes = async () => {
      try {
        // Fetch featured new bikes
        const newBikesResponse = await getBikes('new', 1, true);
        const availableNewBikes = newBikesResponse.results.filter(
          bike => bike.status !== 'unavailable' && bike.status !== 'Unavailable'
        );
        setNewBikes(availableNewBikes);

        // Fetch featured used bikes
        const usedBikesResponse = await getBikes('used', 1, true);
        const availableUsedBikes = usedBikesResponse.results.filter(
          bike => bike.status !== 'unavailable' && bike.status !== 'Unavailable'
        );
        setUsedBikes(availableUsedBikes);

      } catch (err) {
        console.error("Failed to fetch featured bikes:", err);
        setError("Failed to load featured bikes.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBikes();
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
    </div>
  );
};

export default HomePage;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBikes } from '@/api';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const HomeHero: React.FC = () => {
  const [newBikeImageUrls, setNewBikeImageUrls] = useState<string[]>([]);
  const [usedBikeImageUrls, setUsedBikeImageUrls] = useState<string[]>([]);
  const [currentNewBikeImageIndex, setCurrentNewBikeImageIndex] = useState(0);
  const [currentUsedBikeImageIndex, setCurrentUsedBikeImageIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const defaultPlaceholderImage = '/src/assets/motorcycle_images/placeholder.png';

  const preloadImage = (url: string) => {
    if (url) {
      new Image().src = url;
    }
  };

  useEffect(() => {
    const fetchFeaturedBikeImages = async () => {
      try {
        // Fetch featured new bikes
        const newBikesResponse = await getBikes('new', 1, true); // Assuming first page is enough for cycling
        const newUrls: string[] = newBikesResponse.results
          .filter(bike => bike.status !== 'unavailable' && bike.status !== 'Unavailable')
          .map(bike => {
            const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
            return sortedImages[0]?.image || defaultPlaceholderImage;
          });
        setNewBikeImageUrls(newUrls.length > 0 ? newUrls : [defaultPlaceholderImage]);

        // Fetch featured used bikes
        const usedBikesResponse = await getBikes('used', 1, true); // Assuming first page is enough for cycling
        const usedUrls: string[] = usedBikesResponse.results
          .filter(bike => bike.status !== 'unavailable' && bike.status !== 'Unavailable')
          .map(bike => {
            const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
            return sortedImages[0]?.image || defaultPlaceholderImage;
          });
        setUsedBikeImageUrls(usedUrls.length > 0 ? usedUrls : [defaultPlaceholderImage]);

      } catch (err) {
        console.error("Failed to fetch featured bike images for cycling:", err);
        setError("Failed to load featured bike images for cycling.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBikeImages();
  }, []); // Empty dependency array means this runs once on mount

  // Image cycling effect for New Bikes
  useEffect(() => {
    if (newBikeImageUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentNewBikeImageIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % newBikeImageUrls.length;
          preloadImage(newBikeImageUrls[nextIndex]); // Preload the next image
          return nextIndex;
        });
      }, 8000); // Change image every 8 seconds
      return () => clearInterval(interval); // Clear interval on component unmount
    }
  }, [newBikeImageUrls]);

  // Image cycling effect for Used Bikes
  useEffect(() => {
    if (usedBikeImageUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentUsedBikeImageIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % usedBikeImageUrls.length;
          preloadImage(usedBikeImageUrls[nextIndex]); // Preload the next image
          return nextIndex;
        });
      }, 8000); // Change image every 8 seconds
      return () => clearInterval(interval); // Clear interval on component unmount
    }
  }, [usedBikeImageUrls]);


  const renderBikeLink = (condition: 'new' | 'used') => {
    const linkPath = condition === 'new' ? '/bikes/new' : '/bikes/used';
    const text = condition === 'new' ? 'New Bikes' : 'Used Bikes';
    const bgColorClass = 'bg-foreground';

    const currentImageUrl = condition === 'new'
      ? newBikeImageUrls[currentNewBikeImageIndex]
      : usedBikeImageUrls[currentUsedBikeImageIndex];

    return (
      <Link
        to={linkPath}
        className={`relative flex-1 flex items-center justify-center p-4 text-white text-3xl font-bold transition-all duration-1000 ease-in-out group ${bgColorClass}`}
        style={{
          backgroundImage: `url(${currentImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-20 transition-opacity duration-300"></div>
        <span className="relative z-10 text-shadow-lg text-4xl text-bold">{text}</span>
      </Link>
    );
  };

  return (
    <div className="w-full flex flex-col md:flex-row bg-gray-100 min-h-[500px]">
      {/* Left Column */}
      <div className="md:w-1/2 flex flex-col">
        {!loading && !error && (
            <>
                {renderBikeLink('new')}
                {renderBikeLink('used')}
            </>
        )}
      </div>

      {/* Right Column */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-12 text-center bg-foreground">
        <h1 className="text-5xl font-extrabold text-[var(--text-primary)] mb-8">
          Perth Motorcycle/Scooter Mechanic & Dealership
        </h1>
        <p className="text-lg text-[var(--text-primary)] leading-relaxed max-w-prose mb-12">
          Operating in Perth for over 30 years, we are a motorcycle and scooter mechanic and dealership offering new and used sales across petrol and electric models. We provide motorcycle and scooter servicing, including tyre changes, maintenance, and general repairs. 
        </p>
        <Link to="/workshop">
          <Button className="bg-primary text-[var(--text-primary)] font-bold px-8 py-5 text-xl hover:bg-primary/90 flex items-center gap-2">
            Book a Service <ArrowRight className="h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};


export default HomeHero;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBikes } from '@/api';

const HomeHero: React.FC = () => {
  const [newBikeImageUrls, setNewBikeImageUrls] = useState<string[]>([]);
  const [usedBikeImageUrls, setUsedBikeImageUrls] = useState<string[]>([]);
  const [currentNewBikeImageIndex, setCurrentNewBikeImageIndex] = useState(0);
  const [currentUsedBikeImageIndex, setCurrentUsedBikeImageIndex] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const defaultPlaceholderImage = '/src/assets/motorcycle_images/placeholder.png';

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
        setCurrentNewBikeImageIndex(prevIndex => (prevIndex + 1) % newBikeImageUrls.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval); // Clear interval on component unmount
    }
  }, [newBikeImageUrls]);

  // Image cycling effect for Used Bikes
  useEffect(() => {
    if (usedBikeImageUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentUsedBikeImageIndex(prevIndex => (prevIndex + 1) % usedBikeImageUrls.length);
      }, 5000); // Change image every 5 seconds
      return () => clearInterval(interval); // Clear interval on component unmount
    }
  }, [usedBikeImageUrls]);


  const renderBikeLink = (condition: 'new' | 'used') => {
    const linkPath = condition === 'new' ? '/bikes/new' : '/bikes/used';
    const text = condition === 'new' ? 'New Bikes' : 'Used Bikes';
    const bgColorClass = condition === 'new' ? 'bg-green-600' : 'bg-blue-600'; // Fallback color

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
        <span className="relative z-10 text-shadow-lg">{text}</span>
      </Link>
    );
  };

  return (
    <div className="w-full flex flex-col md:flex-row bg-gray-100 min-h-[500px]">
      {/* Left Column */}
      <div className="md:w-1/2 flex flex-col">
        {loading && (
            <>
                <div className="flex-1 flex items-center justify-center p-4 bg-gray-300 text-gray-700 text-3xl font-bold">
                    Loading Used Bikes...
                </div>
                <div className="flex-1 flex items-center justify-center p-4 bg-gray-400 text-gray-700 text-3xl font-bold">
                    Loading New Bikes...
                </div>
            </>
        )}
        {error && (
            <>
                <div className="flex-1 flex items-center justify-center p-4 bg-red-200 text-red-800 text-xl">
                    {error}
                </div>
                <div className="flex-1 flex items-center justify-center p-4 bg-red-300 text-red-800 text-xl">
                    {error}
                </div>
            </>
        )}
        {!loading && !error && (
            <>
                {renderBikeLink('new')}
                {renderBikeLink('used')}
            </>
        )}
      </div>

      {/* Right Column */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-8 text-center bg-gray-200">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Perth Motorcycle/Scooter Mechanic & Dealership
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed max-w-prose">
          Operating in Perth for over 30 years, we are a motorcycle and scooter mechanic and dealership offering new and used sales across petrol and electric models. We provide motorcycle and scooter servicing, including tyre changes, maintenance, and general repairs. We haven’t served
        </p>
      </div>
    </div>
  );
};

export default HomeHero;

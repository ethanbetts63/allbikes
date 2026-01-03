import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBikes } from '@/api';
import type { Bike } from '@/types';

const HomeHero: React.FC = () => {
  const [newBikeImageUrl, setNewBikeImageUrl] = useState<string | null>(null);
  const [usedBikeImageUrl, setUsedBikeImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedBikeImages = async () => {
      try {
        // Fetch featured new bikes
        const newBikesResponse = await getBikes('new', 1, true);
        if (newBikesResponse.results.length > 0) {
          const firstNewBike = newBikesResponse.results[0];
          const sortedImages = [...firstNewBike.images].sort((a, b) => a.order - b.order);
          setNewBikeImageUrl(sortedImages[0]?.image || '/src/assets/motorcycle_images/placeholder.png');
        }

        // Fetch featured used bikes
        const usedBikesResponse = await getBikes('used', 1, true);
        if (usedBikesResponse.results.length > 0) {
          const firstUsedBike = usedBikesResponse.results[0];
          const sortedImages = [...firstUsedBike.images].sort((a, b) => a.order - b.order);
          setUsedBikeImageUrl(sortedImages[0]?.image || '/src/assets/motorcycle_images/placeholder.png');
        }
      } catch (err) {
        console.error("Failed to fetch featured bike images:", err);
        setError("Failed to load featured bike images.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBikeImages();
  }, []);

  const renderBikeLink = (condition: 'new' | 'used', imageUrl: string | null) => {
    const linkPath = condition === 'new' ? '/new-bikes' : '/used-bikes';
    const text = condition === 'new' ? 'New Bikes' : 'Used Bikes';
    const bgColorClass = condition === 'new' ? 'bg-green-600' : 'bg-blue-600'; // Fallback color

    return (
      <Link
        to={linkPath}
        className={`relative flex-1 flex items-center justify-center p-4 text-white text-3xl font-bold transition-colors duration-300 group ${bgColorClass}`}
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {imageUrl && (
          <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-20 transition-opacity duration-300"></div>
        )}
        <span className="relative z-10">{text}</span>
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
                {renderBikeLink('used', usedBikeImageUrl)}
                {renderBikeLink('new', newBikeImageUrl)}
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBikes } from '@/api';
import type { Bike } from '@/types';
import { Button } from '@/components/ui/button';

const HomeHero: React.FC = () => {
    const [newFeaturedBikes, setNewFeaturedBikes] = useState<Bike[]>([]);
    const [usedFeaturedBikes, setUsedFeaturedBikes] = useState<Bike[]>([]);
    const [currentNewImageIndex, setCurrentNewImageIndex] = useState(0);
    const [currentUsedImageIndex, setCurrentUsedImageIndex] = useState(0);

    useEffect(() => {
        const fetchFeaturedBikes = async () => {
            try {
                // Fetch featured new bikes
                const newBikesResponse = await getBikes('new', 1, true);
                // Filter for bikes that have at least one image and sort images by order
                const newBikesWithImages = newBikesResponse.results
                    .filter(bike => bike.images.length > 0)
                    .map(bike => ({
                        ...bike,
                        images: [...bike.images].sort((a, b) => a.order - b.order),
                    }));
                setNewFeaturedBikes(newBikesWithImages);

                // Fetch featured used bikes
                const usedBikesResponse = await getBikes('used', 1, true);
                const usedBikesWithImages = usedBikesResponse.results
                    .filter(bike => bike.images.length > 0)
                    .map(bike => ({
                        ...bike,
                        images: [...bike.images].sort((a, b) => a.order - b.order),
                    }));
                setUsedFeaturedBikes(usedBikesWithImages);

            } catch (error) {
                console.error("Failed to fetch featured bikes:", error);
            }
        };

        fetchFeaturedBikes();
    }, []);

    // Effect for cycling new bike images
    useEffect(() => {
        if (newFeaturedBikes.length > 1) {
            const timer = setInterval(() => {
                setCurrentNewImageIndex(prevIndex =>
                    (prevIndex + 1) % newFeaturedBikes.length
                );
            }, 5000); // Change image every 5 seconds
            return () => clearInterval(timer);
        }
    }, [newFeaturedBikes]);

    // Effect for cycling used bike images
    useEffect(() => {
        if (usedFeaturedBikes.length > 1) {
            const timer = setInterval(() => {
                setCurrentUsedImageIndex(prevIndex =>
                    (prevIndex + 1) % usedFeaturedBikes.length
                );
            }, 5000); // Change image every 5 seconds
            return () => clearInterval(timer);
        }
    }, [usedFeaturedBikes]);

    const getImageUrl = (bikes: Bike[], index: number) => {
        if (!bikes.length || !bikes[index]) return '';
        // Assumes images are pre-sorted and the first one is order 0
        return bikes[index].images[0]?.image || '';
    };

    const newBikeImageUrl = getImageUrl(newFeaturedBikes, currentNewImageIndex);
    const usedBikeImageUrl = getImageUrl(usedFeaturedBikes, currentUsedImageIndex);

    const HeroQuadrant = ({ to, imageUrl, title }: { to: string, imageUrl: string, title: string }) => (
        <Link to={to} className="relative group overflow-hidden rounded-lg h-64 md:h-full flex-grow">
            <div
                style={{ backgroundImage: `url(${imageUrl})` }}
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center p-4">
                <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
                <Button variant="secondary">View Collection</Button>
            </div>
        </Link>
    );

    return (
        <section className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 md:h-[calc(100vh-80px)] max-h-[800px]">
                
                {/* Left Column: Image Quadrants */}
                <div className="md:order-1 grid grid-rows-2 gap-0">
                    <HeroQuadrant to="/inventory?condition=new" imageUrl={newBikeImageUrl} title="New Bikes" />
                    <HeroQuadrant to="/inventory?condition=used" imageUrl={usedBikeImageUrl} title="Used Bikes" />
                </div>

                {/* Right Column: Text Content */}
                <div className="md:order-2 flex flex-col items-center justify-center text-center bg-gray-100 dark:bg-gray-900 p-8">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Find Your Perfect Ride
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-md">
                        Australia's #1 destination for new and used motorcycles. Quality you can trust, prices you'll love.
                    </p>
                </div>
                
            </div>
        </section>
    );
};

export default HomeHero;

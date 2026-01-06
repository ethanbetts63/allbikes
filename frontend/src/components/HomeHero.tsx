import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Bike } from "@/types";
import ContactButtons from './ContactButtons';

// Import default images
import defaultNewImage from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ.webp';
import defaultUsedImage from '@/assets/IMG_20250730_102056.webp';

// Import responsive images for New
import defaultNewImage320 from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ-320w.webp';
import defaultNewImage640 from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ-640w.webp';
import defaultNewImage768 from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ-768w.webp';
import defaultNewImage1024 from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ-1024w.webp';
import defaultNewImage1280 from '@/assets/b5axm1pizbgkl4xj3b1u_I1x6JsQ-1280w.webp';

// Import responsive images for Used
import defaultUsedImage320 from '@/assets/IMG_20250730_102056-320w.webp';
import defaultUsedImage640 from '@/assets/IMG_20250730_102056-640w.webp';
import defaultUsedImage768 from '@/assets/IMG_20250730_102056-768w.webp';
import defaultUsedImage1024 from '@/assets/IMG_20250730_102056-1024w.webp';
import defaultUsedImage1280 from '@/assets/IMG_20250730_102056-1280w.webp';

interface HomeHeroProps {
  newBikes: Bike[];
  usedBikes: Bike[];
  error: string | null;
  phoneNumber?: string;
  emailAddress?: string; 
}

const HomeHero: React.FC<HomeHeroProps> = ({ newBikes, usedBikes, error, phoneNumber, emailAddress }) => {
  const [newBikeImageUrls, setNewBikeImageUrls] = useState<string[]>([defaultNewImage]);
  const [usedBikeImageUrls, setUsedBikeImageUrls] = useState<string[]>([defaultUsedImage]);
  const [currentNewBikeImageIndex, setCurrentNewBikeImageIndex] = useState(0);
  const [currentUsedBikeImageIndex, setCurrentUsedBikeImageIndex] = useState(0);

  const preloadImage = (url: string) => {
    if (url) {
      new Image().src = url;
    }
  };

  useEffect(() => {
    if (newBikes.length > 0) {
      const newUrls = newBikes.map(bike => {
        const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
        return sortedImages[0]?.image;
      }).filter(Boolean) as string[];
      
      if (newUrls.length > 0) {
        setNewBikeImageUrls(newUrls);
      }
    }
  }, [newBikes]);

  useEffect(() => {
    if (usedBikes.length > 0) {
        const usedUrls = usedBikes.map(bike => {
            const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
            return sortedImages[0]?.image;
        }).filter(Boolean) as string[];

        if (usedUrls.length > 0) {
            setUsedBikeImageUrls(usedUrls);
        }
    }
  }, [usedBikes]);

  // Image cycling effect for New Motorcycles and Scooters
  useEffect(() => {
    if (newBikeImageUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentNewBikeImageIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % newBikeImageUrls.length;
          preloadImage(newBikeImageUrls[nextIndex]);
          return nextIndex;
        });
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [newBikeImageUrls]);

  // Image cycling effect for Used Motorcycles and Scooters
  useEffect(() => {
    if (usedBikeImageUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentUsedBikeImageIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % usedBikeImageUrls.length;
          preloadImage(usedBikeImageUrls[nextIndex]);
          return nextIndex;
        });
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [usedBikeImageUrls]);

  const defaultNewSrcSet = `${defaultNewImage320} 320w, ${defaultNewImage640} 640w, ${defaultNewImage768} 768w, ${defaultNewImage1024} 1024w, ${defaultNewImage1280} 1280w`;
  const defaultUsedSrcSet = `${defaultUsedImage320} 320w, ${defaultUsedImage640} 640w, ${defaultUsedImage768} 768w, ${defaultUsedImage1024} 1024w, ${defaultUsedImage1280} 1280w`;

  const renderBikeLink = (condition: 'new' | 'used') => {
    const linkPath = condition === 'new' ? '/inventory/motorcycles/new' : '/inventory/motorcycles/used';
    const text = condition === 'new' ? (
      <>
        <span className="hidden md:inline">New Motorcycles and Scooters</span>
        <span className="md:hidden">New Bikes</span>
      </>
    ) : (
      <>
        <span className="hidden md:inline">Used Motorcycles and Scooters</span>
        <span className="md:hidden">Used Bikes</span>
      </>
    );
    const bgColorClass = 'bg-foreground';

    const isDefaultNew = condition === 'new' && newBikeImageUrls[0] === defaultNewImage;
    const isDefaultUsed = condition === 'used' && usedBikeImageUrls[0] === defaultUsedImage;

    const currentImageUrl = condition === 'new'
      ? newBikeImageUrls[currentNewBikeImageIndex]
      : usedBikeImageUrls[currentUsedBikeImageIndex];

    const srcSet = isDefaultNew ? defaultNewSrcSet : (isDefaultUsed ? defaultUsedSrcSet : undefined);
    const fetchPriority = condition === 'new' ? { fetchPriority: "high" as const } : {};

    return (
      <Link
        to={linkPath}
        className={`relative flex-1 flex items-center justify-center p-4 text-[var(--text-primary)] text-3xl font-bold transition-all duration-1000 ease-in-out group ${bgColorClass} min-h-[200px]`}
      >
        <img
          src={currentImageUrl}
          srcSet={srcSet}
          sizes="(max-width: 768px) 100vw, 50vw"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          {...fetchPriority}
        />
        <div className="absolute inset-0 bg-black opacity-40 group-hover:opacity-20 transition-opacity duration-300"></div>
        <span className="relative z-10 text-shadow-lg text-4xl text-bold">{text}</span>
      </Link>
    );
  };

  return (
    <div className="w-full flex flex-col md:flex-row bg-gray-100 min-h-[500px]">
      {/* Left Column */}
      <div className="md:w-1/2 flex flex-col">
        {!error && (
            <>
                {renderBikeLink('new')}
                {renderBikeLink('used')}
            </>
        )}
        {error && (
            <div className="flex-1 flex items-center justify-center bg-red-100 text-red-700 p-4 text-center">
                There was an error loading the featured images.
            </div>
        )}
      </div>

      {/* Right Column */}
      <div className="md:w-1/2 flex flex-col items-center justify-center p-4 md:p-12 text-center bg-background">
        <h1 className="text-5xl font-extrabold text-[var(--text-primary)] mb-4 leading-snug">
          Perth Motorcycle / Scooter Mechanic & Dealership
        </h1>
        <p className="text-lg text-[var(--text-primary)] leading-relaxed max-w-prose mb-8">
          Operating in Perth for over 30 years, we are a motorcycle and scooter mechanic and dealership offering new and used sales across petrol and electric models. We provide motorcycle and scooter servicing, including tyre changes, maintenance, and general repairs. 
        </p>
        {phoneNumber && emailAddress && (
          <div className="mb-2">
            <ContactButtons phoneNumber={phoneNumber} emailAddress={emailAddress} />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeHero;
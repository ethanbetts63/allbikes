import React, { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import BikeCard from '@/components/BikeCard';
import type { Bike } from '@/components/BikeCard'; // Explicit type import

interface BikeListPageProps {
  bikeCondition: 'new' | 'used';
}

// --- Mock Data (Updated Structure) ---
// In the future, this will come from an API call
const allBikes: Bike[] = [
  { id: 1, make: 'Vespa', model: 'Primavera 150', year: 2024, price: 7340, condition: 'new', imageUrl: '/src/assets/motorcycle_images/primavera-150-racing-sixties-2_2_1_1_2.jpg', odometer: 0, engine_size: 150 },
  { id: 2, make: 'Vespa', model: 'Sprint 150', year: 2024, price: 7640, condition: 'new', imageUrl: '/src/assets/motorcycle_images/sprint-150-2021.jpg', odometer: 0, engine_size: 150 },
  { id: 3, make: 'Royal Enfield', model: 'Interceptor 650', year: 2020, price: 8500, condition: 'used', imageUrl: '/src/assets/motorcycle_images/interceptor-650-glitter-and-dust.jpg', odometer: 5400, engine_size: 650 },
  { id: 4, make: 'Suzuki', model: 'DR-Z400SM', year: 2021, price: 9800, condition: 'used', imageUrl: '/src/assets/motorcycle_images/dr-z400sm-2021.jpg', odometer: 2100, engine_size: 400 },
  { id: 5, make: 'Piaggio', model: 'MP3 500 Sport', year: 2023, price: 15490, condition: 'demo', imageUrl: '/src/assets/motorcycle_images/piaggio-mp3-500-sport-advanced.jpg', odometer: 150, engine_size: 500 },
  { id: 6, make: 'Harley-Davidson', model: 'Street 500', year: 2019, price: 10500, condition: 'used', imageUrl: '/src/assets/motorcycle_images/harley-davidson-street-500.jpg', odometer: 8900, engine_size: 500 },
];
// --- End Mock Data ---


const BikeListPage: React.FC<BikeListPageProps> = ({ bikeCondition }) => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This simulates fetching data from an API.
    console.log(`Fetching ${bikeCondition} bikes...`);
    setIsLoading(true);
    
    let filteredBikes: Bike[];
    if (bikeCondition === 'used') {
      // "Used" page should show both 'used' and 'demo' bikes
      filteredBikes = allBikes.filter(bike => bike.condition === 'used' || bike.condition === 'demo');
    } else {
      filteredBikes = allBikes.filter(bike => bike.condition === bikeCondition);
    }
    
    // Simulate network delay
    setTimeout(() => {
      setBikes(filteredBikes);
      setIsLoading(false);
    }, 500);

  }, [bikeCondition]);

  const pageTitle = bikeCondition === 'new' ? 'New Bikes' : 'Used Bikes';

  return (
    <>
      <Seo title={`${pageTitle} | Allbikes`} />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8">{pageTitle}</h1>
        
        {isLoading ? (
          <p>Loading bikes...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bikes.map(bike => (
              <BikeCard key={bike.id} bike={bike} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BikeListPage;
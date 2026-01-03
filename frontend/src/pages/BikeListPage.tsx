import React, { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import BikeCard, { Bike } from '@/components/BikeCard';

interface BikeListPageProps {
  bikeCondition: 'new' | 'used';
}

// --- Mock Data ---
// In the future, this will come from an API call
const allBikes: Bike[] = [
  { id: 1, name: 'Vespa Primavera 150', price: 7340, condition: 'new', imageUrl: '/src/assets/motorcycle_images/primavera-150-racing-sixties-2_2_1_1_2.jpg' },
  { id: 2, name: 'Vespa Sprint 150', price: 7640, condition: 'new', imageUrl: '/src/assets/motorcycle_images/sprint-150-2021.jpg' },
  { id: 3, name: '2020 Royal Enfield Interceptor 650', price: 8500, condition: 'used', imageUrl: '/src/assets/motorcycle_images/interceptor-650-glitter-and-dust.jpg' },
  { id: 4, name: '2021 Suzuki DR-Z400SM', price: 9800, condition: 'used', imageUrl: '/src/assets/motorcycle_images/dr-z400sm-2021.jpg' },
  { id: 5, name: 'Piaggio MP3 500 Sport', price: 15490, condition: 'new', imageUrl: '/src/assets/motorcycle_images/piaggio-mp3-500-sport-advanced.jpg' },
  { id: 6, name: '2019 Harley-Davidson Street 500', price: 10500, condition: 'used', imageUrl: '/src/assets/motorcycle_images/harley-davidson-street-500.jpg' },
];
// --- End Mock Data ---


const BikeListPage: React.FC<BikeListPageProps> = ({ bikeCondition }) => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This simulates fetching data from an API.
    // We replace this with a real `fetch` call later.
    console.log(`Fetching ${bikeCondition} bikes...`);
    setIsLoading(true);
    const filteredBikes = allBikes.filter(bike => bike.condition === bikeCondition);
    
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
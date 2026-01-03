import React, { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import BikeCard from '@/components/BikeCard';
import type { Bike } from '@/types';
import { getBikes } from '@/api';
import { Spinner } from '@/components/ui/spinner';

interface BikeListPageProps {
  bikeCondition: 'new' | 'used';
}

const BikeListPage: React.FC<BikeListPageProps> = ({ bikeCondition }) => {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBikes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log(`Fetching ${bikeCondition} bikes from API...`);
        const response = await getBikes(bikeCondition);
        setBikes(response.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBikes();
  }, [bikeCondition]);

  const pageTitle = bikeCondition === 'new' ? 'New Bikes' : 'Used Bikes';

  return (
    <>
      <Seo title={`${pageTitle} | Allbikes`} />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8">{pageTitle}</h1>
        
        {isLoading && (
            <div className="flex justify-center items-center h-64">
                <Spinner className="h-12 w-12" />
            </div>
        )}
        
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bikes.length > 0 ? (
              bikes.map(bike => (
                <BikeCard key={bike.id} bike={bike} />
              ))
            ) : (
              <p>No bikes found for this category.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default BikeListPage;
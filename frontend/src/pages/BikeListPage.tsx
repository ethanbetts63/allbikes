import React, { useState, useEffect, useCallback } from 'react';
import Seo from '@/components/Seo';
import BikeCard from '@/components/BikeCard';
import type { Bike } from '@/types';
import { getBikes, type GetBikesOptions } from '@/api';
import { Spinner } from '@/components/ui/spinner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import BikeListHero from '@/components/BikeListHero';
import SymImage from '@/assets/sym_22.webp';
import FilterSort, { type FilterSortOptions } from '@/components/FilterSort';

interface BikeListPageProps {
  bikeCondition: 'new' | 'used';
}

const BikeListPage: React.FC<BikeListPageProps> = ({ bikeCondition }) => {
  const [bikes, setBikes] = useState<Bike[] | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterSortOptions>({});

  const fetchBikes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const options: GetBikesOptions = {
        condition: bikeCondition,
        page: currentPage,
        ...filterOptions,
      };

      const response = await getBikes(options);
      setBikes(response.results);
      setTotalPages(Math.ceil(response.count / 12)); // Page size is 12 from backend
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [bikeCondition, currentPage, filterOptions]);

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on page change
    fetchBikes();
  }, [fetchBikes]);

  const handleFilterChange = (newOptions: FilterSortOptions) => {
    setCurrentPage(1); // Reset to first page on filter change
    setFilterOptions(newOptions);
  };

  const isNew = bikeCondition === 'new';
  const pageTitle = isNew ? 'New Motorcycles and Scooters' : 'Used Motorcycles and Scooters';
  const description = isNew 
    ? "Browse our range of new motorcycles and scooters available in Perth, including petrol and electric models. All New Motorcycles and Scooters are workshop-prepared and available for local purchase through our Perth dealership. All New Motorcycles and Scooters come with a warranty."
    : "Browse our range of used motorcycles and scooters available in Perth, including petrol and electric models. All Used Motorcycles and Scooters are workshop-prepared and available for local purchase through our Perth dealership.";

  return (
    <>
      <Seo 
        title={`${pageTitle} | Allbikes`}
        description={description}
        canonicalPath={isNew ? '/bikes/new' : '/bikes/used'}
      />
      <BikeListHero 
        title={pageTitle}
        description={description}
        imageUrl={SymImage}
      />
      <div className="container mx-auto p-4">
        <FilterSort options={filterOptions} onFilterChange={handleFilterChange} />
        
        {isLoading && (
            <div className="flex justify-center items-center h-64">
                <Spinner className="h-12 w-12" />
            </div>
        )}
        
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bikes && bikes.length > 0 ? (
              bikes.map(bike => (
                <BikeCard key={bike.id} bike={bike} />
              ))
            ) : (
              <p>No bikes found for this category.</p>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((prev) => Math.max(prev - 1, 1));
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="p-2 text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </>
  );
};

export default BikeListPage;
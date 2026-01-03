import React, { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import BikeCard from '@/components/BikeCard';
import type { Bike } from '@/types';
import { getBikes } from '@/api';
import { Spinner } from '@/components/ui/spinner';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

interface BikeListPageProps {
  bikeCondition: 'new' | 'used';
}

const BikeListPage: React.FC<BikeListPageProps> = ({ bikeCondition }) => {
  const [bikes, setBikes] = useState<Bike[] | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBikes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getBikes(bikeCondition, currentPage);
        setBikes(response.results);
        setTotalPages(Math.ceil(response.count / response.page_size));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    window.scrollTo(0, 0); // Scroll to top on page change
    fetchBikes();
  }, [bikeCondition, currentPage]);

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
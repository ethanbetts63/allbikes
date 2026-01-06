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
import Hero from '@/components/Hero';
import SymImage from '@/assets/sym_22.webp';
import FilterSort, { type FilterSortOptions } from '@/components/FilterSort';
import { FaqSection } from '@/components/FaqSection';
import Breadcrumb, { type BreadcrumbItem } from '@/components/Breadcrumb';

interface BikeListPageProps {
  bikeCondition: 'new' | 'used';
}

const newBikeFaqs = [
  {
    question: "What new motorcycles and scooters do you sell?",
    answer: "We sell brand‑new SYM scooters and Segway electric scooters or electric motorcycles. These are the only brands we offer new, so we can confidently stand behind their quality and reliability."
  },
  {
    question: "Can I buy a Vespa or Piaggio new from you?",
    answer: "No. We do not sell new Vespa or new Piaggio models. When available, we offer them only as used or pre‑owned stock."
  },
  {
    question: "Is your dealership in Perth?",
    answer: "Yes. Our motorcycle and scooter dealership and showroom are in Perth, where you can view and buy new SYM or Segway models in person."
  },
  {
    question: "Do you sell electric scooters or electric motorcycles?",
    answer: "Yes. We sell electric scooters and electric motorcycles, including the Segway range, for commuting and everyday riding in Perth."
  },
  {
    question: "Do you have a showroom for new vehicles?",
    answer: "Yes. We operate a scooter and motorcycle showroom in Perth, displaying current new SYM and Segway inventory for direct purchase."
  }
];

const usedBikeFaqs = [
  {
    question: "What used scooters and motorcycles do you sell?",
    answer: "We sell used and second‑hand motorcycles and scooters across a wide range of brands. Each bike is chosen based on condition, reliability, and overall quality—only what we can stand behind is listed."
  },
  {
    question: "Do you sell used Vespa or Piaggio?",
    answer: "Yes. We regularly offer used Vespa and used Piaggio scooters when they meet our standards for quality and reliability."
  },
  {
    question: "Are used bikes inspected before sale?",
    answer: "Yes. All used motorcycles and scooters are inspected and prepared by our workshop before being listed for sale, ensuring a reliable purchase."
  },
  {
    question: "Can I view used bikes at your Perth dealership?",
    answer: "Yes. You can view used motorcycles and scooters at our Perth location unless a listing specifically states otherwise."
  },
  {
    question: "Do you sell second‑hand motorcycles as well as scooters?",
    answer: "Yes. Our pre‑owned inventory includes both second‑hand motorcycles and second‑hand scooters, depending on availability and condition."
  }
];

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
      setTotalPages(Math.ceil(response.count / 12)); 
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [bikeCondition, currentPage, filterOptions]);

  useEffect(() => {
    window.scrollTo(0, 0); 
    fetchBikes();
  }, [fetchBikes]);

  const handleFilterChange = (newOptions: FilterSortOptions) => {
    setCurrentPage(1); // Reset to first page on filter change
    setFilterOptions(newOptions);
  };

  const isNew = bikeCondition === 'new';
  const pageTitle = isNew ? 'New Motorcycles and Scooters' : 'Used Motorcycles and Scooters';
  const responsivePageTitle = isNew ? (
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

  const description = isNew 
    ? "Browse our range of new motorcycles and scooters available in Perth, including petrol and electric models. All New Motorcycles and Scooters are workshop-prepared and available for local purchase through our Perth dealership. All New Motorcycles and Scooters come with a warranty."
    : "Browse our range of used motorcycles and scooters available in Perth, including petrol and electric models. All Used Motorcycles and Scooters are workshop-prepared and available for local purchase through our Perth dealership.";

  const slugify = (text: string) =>
    text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');

  const breadcrumbItems: BreadcrumbItem[] = [
    { name: 'Home', href: '/' },
    { name: pageTitle, href: isNew ? '/bikes/new' : '/bikes/used' }
  ];
  
  const structuredData = bikes && bikes.length > 0 ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": `https://www.allbikesvespawarehouse.com.au${item.href}`
        }))
      },
      {
        "@type": "ItemList",
        "itemListElement": bikes.map((bike, index) => {
          const bikeSlug = `${slugify(bike.make)}-${slugify(bike.model)}-${bike.id}`;
          return {
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Product",
              "url": `https://www.allbikesvespawarehouse.com.au/inventory/motorcycles/${bikeSlug}`,
              "name": `${bike.year} ${bike.make} ${bike.model}`,
              "image": bike.images.length > 0 ? `https://www.allbikesvespawarehouse.com.au${bike.images[0].image}` : `https://www.allbikesvespawarehouse.com.au/src/assets/motorcycle_images/placeholder.png`,
              "description": bike.description,
              "brand": {
                "@type": "Brand",
                "name": bike.make
              },
              "offers": {
                "@type": "Offer",
                "price": bike.price,
                "priceCurrency": "AUD",
                "availability": bike.status.toLowerCase() === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
                "itemCondition": bike.condition.toLowerCase() === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition'
              }
            }
          }
        })
      }
    ]
  } : undefined;

  return (
    <>
      <Seo 
        title={`${pageTitle} | Allbikes`}
        description={description}
        canonicalPath={isNew ? '/bikes/new' : '/bikes/used'}
        structuredData={structuredData}
      />
      <Hero 
        title={responsivePageTitle}
        description={description}
        imageUrl={SymImage}
      />
      <Breadcrumb items={breadcrumbItems} />
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
      <FaqSection 
        title={isNew ? "New Bike FAQs" : "Used Bike FAQs"} 
        faqData={isNew ? newBikeFaqs : usedBikeFaqs} 
      />
    </>
  );
};

export default BikeListPage;
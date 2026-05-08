import { useState, useEffect, useCallback } from 'react';
import Seo from '@/components/Seo';
import ProductCard from '@/components/ProductCard';
import ProductFilterSort from '@/components/ProductFilterSort';
import type { Product } from '@/types/Product';
import type { FilterSortOptions } from '@/types/FilterSortOptions';
import { getProducts } from '@/api';
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
import { FaqSection } from '@/components/FaqSection';
import EScooterWhyBuySection from '@/components/EScooterWhyBuySection';

const faqData = [
  {
    question: 'Do you sell electric scooters online?',
    answer: 'Yes. You can browse and purchase e-scooters directly on our website. Payment is processed securely via Stripe and you will receive an email confirmation with your order details.'
  },
  {
    question: 'Is delivery really free?',
    answer: 'Yes. All e-scooters include free delivery Australia-wide. No hidden fees — the price you see includes GST and delivery.'
  },
  {
    question: 'Are prices inclusive of GST?',
    answer: 'Yes. All prices displayed on our e-scooter page are inclusive of GST. There are no additional taxes added at checkout.'
  },
  {
    question: 'How do I get a refund or return?',
    answer: 'Please visit our Refunds page for details on our returns policy and how to submit a request.'
  }
];

const EScooterListPage = () => {
  const [products, setProducts] = useState<Product[] | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterSortOptions>({});

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProducts({
        page: currentPage,
        ordering: filterOptions.ordering,
        min_price: filterOptions.min_price,
        max_price: filterOptions.max_price,
      });
      setProducts(data.results);
      setTotalPages(Math.ceil(data.count / 12));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterOptions]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProducts();
  }, [fetchProducts]);

  const handleFilterChange = (newOptions: FilterSortOptions) => {
    setCurrentPage(1);
    setFilterOptions(newOptions);
  };

  const structuredData = products && products.length > 0 ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.scootershop.com.au/" },
          { "@type": "ListItem", "position": 2, "name": "Electric Scooters", "item": "https://www.scootershop.com.au/escooters" }
        ]
      },
      {
        "@type": "ItemList",
        "itemListElement": products.map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "url": `https://www.scootershop.com.au/escooters/${product.slug}`,
            "name": product.name,
            ...(product.images[0]?.image && { "image": product.images[0].image }),
            ...(product.description && { "description": product.description }),
            ...(product.brand && { "brand": { "@type": "Brand", "name": product.brand } }),
            "offers": {
              "@type": "Offer",
              "price": product.discount_price && parseFloat(product.discount_price) > 0 ? product.discount_price : product.price,
              "priceCurrency": "AUD",
              "availability": product.in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          }
        }))
      }
    ]
  } : undefined;

  return (
    <>
      <Seo
        title="Electric Scooters for Sale | ScooterShop Perth"
        description="Shop our range of electric scooters online. All prices include GST with free delivery Australia-wide. Secure payment via Stripe."
        canonicalPath="/escooters"
        structuredData={structuredData}
      />

      <Hero
        title="Electric Scooters"
        description="Buy online with free delivery Australia-wide. All prices include GST and are processed securely via Stripe."
        imageUrl={SymImage}
      />


      <div className="bg-[var(--card)]">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <ProductFilterSort options={filterOptions} onFilterChange={handleFilterChange} />

          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <Spinner className="h-12 w-12" />
            </div>
          )}

          {error && <p className="text-destructive text-center">{error}</p>}

          {!isLoading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <p className="col-span-3 py-16 text-center text-[var(--text-dark-secondary)]">No e-scooters currently available. Check back soon.</p>
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
      </div>

      <EScooterWhyBuySection buttonLink="/electric-scooters" buttonText="More about our e-scooters" />

      <FaqSection title="E-Scooter FAQs" faqData={faqData} />
    </>
  );
};

export default EScooterListPage;

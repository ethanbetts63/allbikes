import ProductCard from '@/components/ProductCard';
import ProductFilterForm from '@/components/ProductFilterForm';
import type { Product } from '@/types/Product';
import type { FilterSortOptions } from '@/types/FilterSortOptions';
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
import { buildListHref } from '@/lib/listQuery';

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

interface EScooterListPageProps {
  products: Product[];
  totalPages: number;
  currentPage: number;
  filters: FilterSortOptions;
}

const EScooterListPage = ({ products, totalPages, currentPage, filters }: EScooterListPageProps) => {
  return (
    <>
      <Hero
        title="Electric Scooters"
        description="Buy online with free delivery Australia-wide. All prices include GST and are processed securely via Stripe."
        imageUrl={SymImage.src}
      />


      <div className="bg-[var(--card)]">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <ProductFilterForm basePath="/escooters" filters={filters} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="col-span-3 py-16 text-center text-[var(--text-dark-secondary)]">No e-scooters currently available. Check back soon.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={buildListHref('/escooters', filters, Math.max(currentPage - 1, 1))}
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
                      href={buildListHref('/escooters', filters, Math.min(currentPage + 1, totalPages))}
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

import StructuredDataScript from '@/components/StructuredDataScript';
import EScooterHero from '@/components/EScooterHero';
import EScooterUSPs from '@/components/EScooterUSPs';
import EScooterWhyBuySection from '@/components/EScooterWhyBuySection';
import EScooterMopedsSection from '@/components/EScooterMopedsSection';
import PayLaterSection from '@/components/PayLaterSection';
import { FaqSection } from '@/components/FaqSection';
import ProductCard from '@/components/ProductCard';
import ProductFilterForm from '@/components/ProductFilterForm';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import type { Product } from '@/types/Product';
import type { FilterSortOptions } from '@/types/FilterSortOptions';
import { siteSettings } from '@/config/siteSettings';
import { buildLocalBusinessSchema, buildBreadcrumbSchema, buildFaqSchema } from '@/lib/seo';
import { buildListHref } from '@/lib/listQuery';

const faqData = [
  {
    question: 'Can I buy an electric scooter online and have it delivered anywhere in Australia?',
    answer: 'Yes. We ship Australia-wide with free delivery on every order. Whether you\'re in Perth, Sydney, Melbourne, Brisbane, Adelaide or any other city in Australia — your e-scooter will be delivered to your door at no extra charge.',
  },
  {
    question: 'Are your electric scooter prices inclusive of GST?',
    answer: 'Yes, all prices displayed on this site include GST. There are no additional taxes or hidden fees added at checkout.',
  },
  {
    question: 'How do I buy an electric scooter online?',
    answer: 'Simply browse the range on our E-Scooters page, click the model you\'re interested in, and hit Buy Now. Payment is handled securely by Stripe. You\'ll receive an order confirmation email immediately after purchase.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards via Stripe, as well as buy now, pay later options including Afterpay, Klarna, and Zip.',
  },
  {
    question: 'Do electric scooters come with a warranty?',
    answer: 'Yes. Every e-scooter we sell comes with a 12-month manufacturer warranty.',
  },
  {
    question: 'Do you service electric scooters?',
    answer: 'Yes. Our workshop in Dianella, Perth services electric scooters and electric mopeds. If you purchase from us and need a service or repair down the track, we\'re here to help.',
  },
  {
    question: 'What is the range of an electric scooter?',
    answer: 'Range depends on the model, rider weight, terrain, and speed. Most of the e-scooters we carry offer a practical range of 25-60 km per charge. Check each product listing for specific range specifications.',
  },
];

const breadcrumbSchema = buildBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'Electric Scooters', path: '/escooters' },
]);

interface ElectricScootersLandingPageProps {
  products: Product[];
  totalPages: number;
  currentPage: number;
  filters: FilterSortOptions;
}

const ElectricScootersLandingPage = ({ products, totalPages, currentPage, filters }: ElectricScootersLandingPageProps) => {
  return (
    <div>
      <StructuredDataScript structuredData={[breadcrumbSchema, buildLocalBusinessSchema(siteSettings), buildFaqSchema(faqData)].filter(Boolean) as object[]} />

      <EScooterHero />

      <EScooterUSPs />

      {!siteSettings.hide_escooters && (
        <section className="bg-[var(--card)]">
          <div className="container mx-auto px-4 lg:px-8 py-12">
            <div className="mb-8">
              <p className="text-[var(--highlight)] text-xs font-bold uppercase tracking-[0.25em] mb-2">Shop Online</p>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-dark-primary)]">Electric Scooters for Sale</h2>
            </div>

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
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
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
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </section>
      )}

      <EScooterMopedsSection />

      <EScooterWhyBuySection buttonLink="/escooters" buttonText="Browse All E-Scooters" />

      <PayLaterSection />

      <FaqSection
        title="Electric Scooter FAQs"
        faqData={faqData}
      />
    </div>
  );
};

export default ElectricScootersLandingPage;

import { useState, useEffect } from 'react';
import Seo from '@/components/Seo';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/Product';
import { getProducts } from '@/api';
import { Spinner } from '@/components/ui/spinner';
import Hero from '@/components/Hero';
import SymImage from '@/assets/sym_22.webp';
import { FaqSection } from '@/components/FaqSection';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getProducts();
        setProducts(data.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <>
      <Seo
        title="Electric Scooters | Scooter Shop"
        description="Shop our range of electric scooters online. All prices include GST with free delivery Australia-wide. Secure payment via Stripe."
        canonicalPath="/escooters"
      />

      <Hero
        title="Electric Scooters"
        description="Buy online with free delivery Australia-wide. All prices include GST and are processed securely via Stripe."
        imageUrl={SymImage}
      />

      <div className="container mx-auto p-4">
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Spinner className="h-12 w-12" />
          </div>
        )}

        {error && <p className="text-destructive text-center">{error}</p>}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p>No e-scooters currently available. Check back soon.</p>
            )}
          </div>
        )}
      </div>

      <FaqSection title="E-Scooter FAQs" faqData={faqData} />
    </>
  );
};

export default EScooterListPage;

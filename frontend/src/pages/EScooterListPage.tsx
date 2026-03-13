import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '@/api';
import type { Product } from '@/types/Product';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Seo from '@/components/Seo';
import { Zap, Truck } from 'lucide-react';

const StockBadge = ({ product }: { product: Product }) => {
  if (!product.in_stock) {
    return <Badge variant="destructive">Out of Stock</Badge>;
  }
  if (product.low_stock) {
    return <Badge variant="outline" className="border-orange-500 text-orange-600">Low Stock</Badge>;
  }
  return <Badge variant="outline" className="border-green-500 text-green-600">In Stock</Badge>;
};

const ProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate();
  const primaryImage = product.images
    .slice()
    .sort((a, b) => a.order - b.order)
    .find((img) => img.order === 0);

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow">
      <div
        className="aspect-square bg-muted overflow-hidden cursor-pointer"
        onClick={() => navigate(`/escooters/${product.slug}`)}
      >
        {primaryImage?.thumbnail ? (
          <img
            src={primaryImage.thumbnail}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Zap className="h-12 w-12 opacity-30" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow gap-2">
        {product.brand && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{product.brand}</p>
        )}
        <h3
          className="font-semibold text-[var(--text-primary)] cursor-pointer hover:underline line-clamp-2"
          onClick={() => navigate(`/escooters/${product.slug}`)}
        >
          {product.name}
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <StockBadge product={product} />
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Truck className="h-3 w-3" />
            Free Delivery
          </Badge>
        </div>

        <div className="mt-auto pt-2">
          <p className="text-lg font-bold text-[var(--text-primary)]">
            ${parseFloat(product.price).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground">incl. GST</p>
        </div>

        <Button
          className="w-full mt-2"
          disabled={!product.in_stock}
          onClick={() => navigate(`/escooters/${product.slug}`)}
        >
          {product.in_stock ? 'View & Buy' : 'Out of Stock'}
        </Button>
      </div>
    </div>
  );
};

const EScooterListPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data.results);
      } catch {
        setError('Failed to load e-scooters. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <>
      <Seo
        title="Electric Scooters Perth | Scooter Shop"
        description="Shop our range of electric scooters. All prices include GST and free delivery. Buy online with secure payment."
      />

      {/* Hero */}
      <section className="bg-foreground text-[var(--text-primary)] py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-4">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Electric Scooters</h1>
          <p className="text-lg text-muted-foreground">
            Quality e-scooters delivered to your door. All prices include GST and free delivery across Australia.
          </p>
        </div>
      </section>

      {/* Product grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border rounded-lg h-96 animate-pulse bg-muted" />
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No e-scooters currently available. Check back soon.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Trust section */}
      <section className="bg-muted py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Free Delivery</p>
            <p className="text-sm text-muted-foreground">Free Australia-wide delivery on all e-scooters.</p>
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Secure Payment</p>
            <p className="text-sm text-muted-foreground">Payments processed securely via Stripe.</p>
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">Perth Based</p>
            <p className="text-sm text-muted-foreground">Local dealership with expert support.</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default EScooterListPage;

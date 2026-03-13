import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById } from '@/api';
import type { Product } from '@/types/Product';
import type { ProductImage } from '@/types/ProductImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Seo from '@/components/Seo';
import { Zap, Truck, ChevronRight } from 'lucide-react';

const StockBadge = ({ product }: { product: Product }) => {
  if (!product.in_stock) {
    return <Badge variant="destructive" className="text-sm px-3 py-1">Out of Stock</Badge>;
  }
  if (product.low_stock) {
    return (
      <Badge variant="outline" className="border-orange-500 text-orange-600 text-sm px-3 py-1">
        Low Stock — only {product.stock_quantity} left
      </Badge>
    );
  }
  return <Badge variant="outline" className="border-green-500 text-green-600 text-sm px-3 py-1">In Stock</Badge>;
};

const EScooterDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ProductImage | null>(null);

  // Extract product id from the trailing segment of the slug (name-{id})
  const productId = slug ? Number(slug.split('-').pop()) : null;

  useEffect(() => {
    if (!productId || isNaN(productId)) {
      setError('Product not found.');
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const data = await getProductById(productId);
        setProduct(data);
      } catch {
        setError('Product not found.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const sortedImages = useMemo(
    () => (product?.images || []).slice().sort((a, b) => a.order - b.order),
    [product]
  );

  useEffect(() => {
    if (sortedImages.length > 0 && !selectedImage) {
      setSelectedImage(sortedImages[0]);
    }
  }, [sortedImages]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-muted rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-12 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4">{error || 'Product not found.'}</p>
        <Button variant="outline" onClick={() => navigate('/escooters')}>
          Back to E-Scooters
        </Button>
      </div>
    );
  }

  const primaryImageUrl = selectedImage?.medium || selectedImage?.image;

  return (
    <>
      <Seo
        title={`${product.name} | Scooter Shop`}
        description={product.description || `Buy ${product.name} online. Price includes GST and free delivery.`}
        ogImage={sortedImages[0]?.medium}
      />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:underline">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/escooters" className="hover:underline">E-Scooters</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--text-primary)]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
              {primaryImageUrl ? (
                <img
                  src={primaryImageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <Zap className="h-16 w-16 opacity-20" />
                </div>
              )}
            </div>

            {sortedImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {sortedImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className={`flex-shrink-0 h-16 w-16 rounded overflow-hidden border-2 transition-colors ${
                      selectedImage?.id === img.id
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted-foreground'
                    }`}
                  >
                    <img
                      src={img.medium || img.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {product.brand && (
              <p className="text-sm text-muted-foreground uppercase tracking-wide">{product.brand}</p>
            )}
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{product.name}</h1>

            <div className="flex flex-wrap gap-2 items-center">
              <StockBadge product={product} />
              <Badge variant="outline" className="flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Free Delivery
              </Badge>
            </div>

            <div>
              <p className="text-4xl font-bold text-[var(--text-primary)]">
                ${parseFloat(product.price).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-muted-foreground">Price includes GST</p>
            </div>

            {product.description && (
              <div className="prose prose-sm max-w-none text-[var(--text-primary)]">
                <p className="whitespace-pre-line">{product.description}</p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button
                className="w-full text-base py-6"
                disabled={!product.in_stock}
                onClick={() => navigate(`/checkout/${product.slug}`)}
              >
                {product.in_stock ? 'Buy Now' : 'Out of Stock'}
              </Button>

              {!product.in_stock && (
                <p className="text-sm text-muted-foreground text-center">
                  This product is currently out of stock.
                </p>
              )}
            </div>

            <div className="border-t pt-4 text-sm text-muted-foreground space-y-1">
              <p>✓ Secure payment via Stripe</p>
              <p>✓ Free delivery Australia-wide</p>
              <p>✓ Order confirmation sent to your email</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EScooterDetailPage;

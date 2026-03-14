import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';
import type { Product } from '@/types/Product';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const sortedImages = [...product.images].sort((a, b) => a.order - b.order);
  const primaryImage = sortedImages[0];
  const imageUrl = primaryImage?.thumbnail || primaryImage?.image;

  return (
    <Link to={`/escooters/${product.slug}`} className="block group">
      <div className="bg-white rounded-lg shadow-sm hover:-translate-y-1 transition-transform duration-200 overflow-hidden flex flex-col h-full">

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-stone-100 flex items-center justify-center text-[var(--text-light-secondary)] text-sm">
              No image
            </div>
          )}

          {/* Stock status pill */}
          {!product.in_stock && (
            <span className="absolute top-3 left-3 bg-stone-900/80 text-destructive text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              Out of Stock
            </span>
          )}
          {product.low_stock && product.in_stock && (
            <span className="absolute top-3 left-3 bg-stone-900/80 text-[var(--highlight)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              Low Stock
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-3.5 py-3 flex flex-col gap-2 flex-1">
          <div>
            {product.brand && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">{product.brand}</p>
            )}
            <h3 className="text-base font-bold text-[var(--text-dark-primary)] leading-snug">{product.name}</h3>
          </div>

          {/* Free delivery */}
          <p className="flex items-center gap-1 text-xs text-[var(--text-dark-secondary)]">
            <Truck className="h-3.5 w-3.5" />
            Free delivery Australia-wide
          </p>

          {/* Price */}
          <div className="mt-auto pt-1">
            {product.discount_price && parseFloat(product.discount_price) > 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-[var(--text-dark-secondary)] line-through text-sm">
                  ${parseFloat(product.price).toLocaleString()}
                </span>
                <span className="text-[var(--highlight)] font-black text-xl">
                  ${parseFloat(product.discount_price).toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-[var(--text-dark-primary)] font-black text-xl">
                ${parseFloat(product.price).toLocaleString()}
              </span>
            )}
            <span className="text-xs text-[var(--text-dark-secondary)]">incl. GST</span>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default ProductCard;

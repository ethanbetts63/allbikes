import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Flame } from 'lucide-react';
import type { ProductCardProps } from '@/types/ProductCardProps';

const ProductCard = ({ product }: ProductCardProps) => {
  const sortedImages = [...product.images].sort((a, b) => a.order - b.order);
  const primaryImage = sortedImages[0];
  const imageUrl = primaryImage?.thumbnail || primaryImage?.image;

  return (
    <Link to={`/escooters/${product.slug}`} className="block group">
      <div className={`bg-[var(--card)] border transition-colors duration-200 flex flex-col h-full ${product.popular ? 'border-[var(--highlight)]' : 'border-[var(--border-light)] group-hover:border-[var(--highlight)]'}`}>

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-[var(--bg-light-secondary)] flex items-center justify-center text-[var(--text-light-secondary)] text-sm">
              No image
            </div>
          )}

          {/* Popular pill */}
          {product.popular && (
            <span className="absolute top-3 right-3 bg-[var(--highlight)] text-[var(--text-dark-primary)] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
              <Flame className="h-3 w-3" />
              Popular
            </span>
          )}
          {/* Stock status pill */}
          {!product.in_stock && (
            <span className="absolute top-3 left-3 bg-[var(--bg-dark-primary)]/80 text-destructive text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              Out of Stock
            </span>
          )}
          {product.low_stock && product.in_stock && (
            <span className="absolute top-3 left-3 bg-[var(--bg-dark-primary)]/80 text-[var(--highlight)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              Low Stock
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-4 flex flex-col gap-2.5 flex-1">
          <div>
            {product.brand && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">{product.brand}</p>
            )}
            <h3 className="text-base font-bold text-[var(--text-dark-primary)] leading-snug">{product.name}</h3>
          </div>

          {/* Free delivery + warranty */}
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-1 text-xs text-[var(--text-dark-secondary)]">
              <Truck className="h-3.5 w-3.5 shrink-0" />
              Free delivery Australia-wide
            </p>
            <p className="flex items-center gap-1 text-xs text-[var(--text-dark-secondary)]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[var(--highlight1)]" />
              12 months manufacturer warranty
            </p>
          </div>

          {/* Price */}
          <div className="mt-auto pt-3 border-t border-[var(--border-light)]">
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
            <span className="text-xs text-[var(--text-dark-secondary)] mt-0.5 block">incl. GST</span>
          </div>
        </div>

      </div>
    </Link>
  );
};

export default ProductCard;

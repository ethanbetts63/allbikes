import { Link } from 'react-router-dom';
import { Zap, Truck, ArrowRight } from 'lucide-react';
import stripeLogo from '@/assets/stripe-ar21.svg';
import type { Product } from '@/types/Product';

interface FeaturedEScootersProps {
  products: Product[];
}

const FeaturedEScooters = ({ products }: FeaturedEScootersProps) => {
  if (products.length === 0) return null;

  return (
    <section className="bg-stone-900 py-14 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <p className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.25em]">
              Buy Online
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500 text-[10px] uppercase tracking-widest">Powered by</span>
              <img src={stripeLogo} alt="Stripe" className="h-4 w-auto" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-white text-3xl md:text-4xl font-black uppercase italic leading-none">
              Best Selling<br />E-Scooters
            </h2>
            <Link
              to="/escooters"
              className="hidden sm:inline-flex items-center gap-2 shrink-0 border border-amber-400 text-amber-400 hover:border-stone-500 hover:text-stone-500 font-bold text-xs uppercase tracking-widest px-4 py-2.5 transition-colors duration-200"
            >
              View All E-Scooters <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Free delivery banner */}
        <div className="flex items-center gap-3 bg-stone-800 px-5 py-3 mb-6 w-fit">
          <Truck className="h-5 w-5 text-amber-400 shrink-0" />
          <span className="text-white text-sm font-bold uppercase tracking-widest">Free Delivery Australia-Wide</span>
        </div>

        {/* Product tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {products.map((product) => {
            const primaryImage = [...product.images].sort((a, b) => a.order - b.order)[0];
            const imageUrl = primaryImage?.thumbnail || primaryImage?.image;
            const displayPrice = product.discount_price && parseFloat(product.discount_price) > 0
              ? product.discount_price
              : product.price;
            return (
              <Link
                key={product.id}
                to={`/escooters/${product.slug}`}
                className="group bg-white rounded-lg overflow-hidden flex flex-col hover:-translate-y-1 transition-transform duration-200"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Zap className="h-10 w-10 text-stone-300" />
                    </div>
                  )}
                  {!product.in_stock && (
                    <span className="absolute top-3 left-3 bg-stone-900/80 text-red-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      Out of Stock
                    </span>
                  )}
                  {product.low_stock && product.in_stock && (
                    <span className="absolute top-3 left-3 bg-stone-900/80 text-amber-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      Low Stock
                    </span>
                  )}
                </div>
                <div className="px-4 py-4 flex flex-col gap-1 flex-1">
                  {product.brand && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{product.brand}</p>
                  )}
                  <p className="font-bold text-stone-900 text-lg leading-snug">{product.name}</p>
                  <div className="mt-auto pt-2 flex items-end justify-between">
                    <div>
                      {product.discount_price && parseFloat(product.discount_price) > 0 ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-stone-400 line-through text-sm">${parseFloat(product.price).toLocaleString()}</span>
                          <span className="text-amber-500 font-black text-xl">${parseFloat(product.discount_price).toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-stone-900 font-black text-xl">${parseFloat(displayPrice).toLocaleString()}</span>
                      )}
                      <p className="text-xs text-stone-500 mt-0.5">incl. GST</p>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-500 group-hover:underline">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile CTA */}
        <Link
          to="/escooters"
          className="sm:hidden inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold text-sm uppercase tracking-widest px-6 py-3 transition-colors duration-200"
        >
          View All E-Scooters
          <ArrowRight className="h-4 w-4" />
        </Link>

      </div>
    </section>
  );
};

export default FeaturedEScooters;

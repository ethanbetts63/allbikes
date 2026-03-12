import { Link } from "react-router-dom";
import { Wrench, Cog, Gauge } from "lucide-react";
import type { BikeCardProps } from "@/types/BikeCardProps";

const BikeCard = ({ bike }: BikeCardProps) => {
  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
  const primaryImage = sortedImages[0];
  const imageUrl = primaryImage?.thumbnail || primaryImage?.image || '/src/assets/motorcycle_images/placeholder.png';
  const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

  return (
    <Link to={`/inventory/motorcycles/${bike.slug}`} className="block group">
      <div className="bg-white rounded-lg shadow-sm hover:-translate-y-1 transition-transform duration-200 overflow-hidden flex flex-col h-full">

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden shrink-0">
          <img
            src={imageUrl}
            alt={cardTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Condition pill */}
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded capitalize">
            {bike.condition}
          </span>
          {/* Status pills */}
          {bike.status === 'sold' && (
            <span className="absolute top-3 left-3 bg-stone-900/80 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              Sold
            </span>
          )}
          {bike.status === 'reserved' && (
            <span className="absolute top-3 left-3 bg-stone-900/80 text-amber-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              Reserved
            </span>
          )}
          {bike.status === 'available_soon' && (
            <span className="absolute top-3 left-3 bg-stone-900/80 text-green-400 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              Coming Soon
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-3.5 py-3 flex flex-col gap-2 flex-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-600 mb-0.5">{bike.make}</p>
            <h3 className="text-base font-bold text-stone-900 leading-snug">
              {bike.year && <span className="text-stone-600 font-normal">{bike.year} </span>}
              {bike.model}
            </h3>
          </div>

          {/* Specs */}
          <div className="flex items-center gap-3 text-sm text-stone-500">
            {bike.odometer > 0 && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5" />
                {bike.odometer.toLocaleString()} km
              </span>
            )}
            {bike.engine_size && (
              <span className="flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5" />
                {bike.engine_size}cc
              </span>
            )}
            {bike.transmission && (
              <span className="flex items-center gap-1">
                <Cog className="h-3.5 w-3.5" />
                {bike.transmission}
              </span>
            )}
          </div>

          {/* Warranty */}
          {bike.condition === 'new' && (
            <p className="text-xs text-stone-600">
              {bike.warranty_months && bike.warranty_months > 0
                ? `3 months rego · ${bike.warranty_months} months warranty`
                : '3 months rego included'}
            </p>
          )}

          {/* Price */}
          <div className="mt-auto pt-1">
            {bike.discount_price && parseFloat(bike.discount_price) > 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-stone-500 line-through text-sm">
                  ${parseFloat(bike.price).toLocaleString()}
                </span>
                <span className="text-amber-400 font-black text-xl">
                  ${parseFloat(bike.discount_price).toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-stone-900 font-black text-xl">
                ${parseFloat(bike.price).toLocaleString()}
              </span>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
};

export default BikeCard;

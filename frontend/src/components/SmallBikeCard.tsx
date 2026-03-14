import { Link } from "react-router-dom";
import { Wrench, Cog } from "lucide-react";
import type { SmallBikeCardProps } from "@/types/SmallBikeCardProps";

const SmallBikeCard: React.FC<SmallBikeCardProps> = ({ bike }) => {
  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
  const primaryImage = sortedImages[0];

  const placeholderImage = '/src/assets/motorcycle_images/placeholder.png';

  const thumbnailUrl = primaryImage?.thumbnail || primaryImage?.image || placeholderImage;
  const fullImageUrl = primaryImage?.image || placeholderImage;

  const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;
  const slug = bike.slug;

  const srcSet = primaryImage ? `${thumbnailUrl} 400w, ${fullImageUrl} 1200w` : '';

  return (
    <Link to={`/inventory/motorcycles/${slug}`} className="block h-full">
      <div className="relative w-full overflow-hidden flex flex-col h-full bg-white rounded-lg shadow-sm hover:-translate-y-1 transition-transform duration-200">
        {bike.status === 'sold' && (
          <span className="absolute top-2.5 left-2.5 z-10 bg-red-600 text-[var(--text-light-primary)] text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
            Sold
          </span>
        )}
        {bike.status === 'reserved' && (
          <span className="absolute top-2.5 left-2.5 z-10 bg-amber-500 text-[var(--text-dark-primary)] text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
            Reserved
          </span>
        )}
        <div className="relative h-32 shrink-0">
          <img
            src={thumbnailUrl}
            srcSet={srcSet}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={cardTitle}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="px-3 py-2.5 flex flex-col flex-1 gap-1.5">
          <h3 className="text-base font-bold text-[var(--text-dark-primary)] leading-snug">{cardTitle}</h3>
          <div className="flex items-center gap-3 text-sm text-[var(--text-dark-secondary)]">
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
          <div className="mt-auto pt-1">
            {bike.discount_price && parseFloat(bike.discount_price) > 0 ? (
              <div className="flex items-baseline gap-2">
                <span className="text-[var(--text-dark-secondary)] line-through text-sm">
                  ${parseFloat(bike.price).toLocaleString()}
                </span>
                <span className="text-[var(--highlight)] font-black text-xl">
                  ${parseFloat(bike.discount_price).toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-[var(--text-dark-primary)] font-black text-xl">
                ${parseFloat(bike.price).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SmallBikeCard;

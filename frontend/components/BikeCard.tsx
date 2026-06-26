import Link from 'next/link';
import NextImage from 'next/image';
import { Wrench, Cog, Gauge, Flame } from "lucide-react";
import type { BikeCardProps } from "@/types/BikeCardProps";
import { getPrimaryVehicleImage } from '@/utils/vehicleImages';

const BikeCard = ({ bike, priority = false }: BikeCardProps & { priority?: boolean }) => {
  const imageUrl = getPrimaryVehicleImage(bike.images, 'card');
  const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

  return (
    <Link href={`/inventory/motorcycles/${bike.slug}`} className="block group">
      <div className={`bg-[var(--card)] border transition-colors duration-200 flex flex-col h-full ${bike.popular ? 'border-[var(--highlight)]' : 'border-[var(--border-light)] group-hover:border-[var(--highlight)]'}`}>

        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden shrink-0">
          {imageUrl ? (
            <NextImage
              src={imageUrl}
              alt={cardTitle}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full bg-[var(--bg-light-secondary)]" />
          )}
          {/* Condition pill */}
          <span className="absolute bottom-2 left-2 bg-black/60 text-[var(--text-light-primary)] text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded capitalize">
            {bike.condition}
          </span>
          {/* LAMS pill */}
          {bike.is_lams_approved && (
            <span className="absolute bottom-2 right-2 bg-green-600 text-white text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
              LAMS
            </span>
          )}
          {/* Popular pill */}
          {bike.popular && (
            <span className="absolute top-3 right-3 bg-[var(--highlight)] text-[var(--text-dark-primary)] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
              <Flame className="h-3 w-3" />
              Popular
            </span>
          )}
          {/* Status pills */}
          {bike.status === 'sold' && (
            <span className="absolute top-3 left-3 bg-[var(--bg-dark-primary)]/80 text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              Sold
            </span>
          )}
          {bike.status === 'reserved' && (
            <span className="absolute top-3 left-3 bg-[var(--bg-dark-primary)]/80 text-[var(--highlight)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              Reserved
            </span>
          )}
          {bike.status === 'available_soon' && (
            <span className="absolute top-3 left-3 bg-[var(--bg-dark-primary)]/80 text-[var(--text-light-primary)] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
              In Preparation
            </span>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-4 flex flex-col gap-2.5 flex-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">{bike.make}</p>
            <h3 className="text-base font-bold text-[var(--text-dark-primary)] leading-snug">
              {bike.year && <span className="text-[var(--text-dark-secondary)] font-normal">{bike.year} </span>}
              {bike.model}
            </h3>
          </div>

          {/* Specs */}
          <div className="flex items-center gap-3 text-sm text-[var(--text-dark-secondary)]">
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
            <p className="text-xs text-[var(--text-dark-secondary)]">
              {bike.warranty_months && bike.warranty_months > 0
                ? `3 months rego · ${bike.warranty_months} months warranty`
                : '3 months rego included'}
            </p>
          )}

          {/* Price */}
          <div className="mt-auto pt-3 border-t border-[var(--border-light)]">
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

export default BikeCard;

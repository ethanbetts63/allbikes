import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BikeCardProps } from "@/types/BikeCardProps";

const BikeCard = ({ bike }: BikeCardProps) => {
  const navigate = useNavigate();
  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
  const imageUrl = sortedImages[0]?.image || '/src/assets/motorcycle_images/placeholder.png';
  const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

  return (
    <Card
      onClick={() => navigate(`/inventory/motorcycles/${bike.slug}`)}
      className="relative w-full overflow-hidden flex flex-col pt-0 cursor-pointer border border-border hover:border-green-400 hover:-translate-y-0.5 transition-all duration-300 group"
    >
      {/* Status ribbons */}
      {bike.status === 'sold' && (
        <div className="absolute top-5 right-[-35px] w-32 transform rotate-45 bg-destructive text-white text-center font-bold z-10 text-xl">
          Sold
        </div>
      )}
      {bike.status === 'available_soon' && (
        <div className="absolute top-5 right-[-35px] w-32 transform rotate-45 bg-blue-500 text-white text-center font-bold z-10 text-sm">
          Coming Soon
        </div>
      )}

      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={imageUrl}
          alt={cardTitle}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <Badge className="absolute bottom-2 left-2 capitalize bg-black/60 hover:bg-black/60 text-white border-0">
          {bike.condition}
        </Badge>
      </div>

      {/* Body */}
      <CardContent className="p-4 flex-grow flex flex-col gap-3">
        {/* Make + model */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
            {bike.make}
          </p>
          <h3 className="font-bold text-lg leading-tight">
            {bike.year && (
              <span className="text-muted-foreground font-normal text-base">{bike.year} </span>
            )}
            {bike.model}
          </h3>
        </div>

        {/* Price */}
        <div>
          {bike.discount_price && parseFloat(bike.discount_price) > 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-primary">
                ${parseFloat(bike.discount_price).toLocaleString()}
              </span>
              <span className="text-sm text-destructive line-through">
                ${parseFloat(bike.price).toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold text-primary">
              ${parseFloat(bike.price).toLocaleString()}
            </span>
          )}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{bike.odometer.toLocaleString()} km</span>
          {bike.engine_size && (
            <>
              <span>·</span>
              <span>{bike.engine_size}cc</span>
            </>
          )}
        </div>

        {/* New bike warranty */}
        {bike.condition === 'new' && (
          <p className="text-sm text-blue-600 font-medium">
            {bike.warranty_months && bike.warranty_months > 0
              ? `Includes 3 months rego & ${bike.warranty_months} months warranty`
              : 'Includes 3 months rego'}
          </p>
        )}
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0">
        <Link
          to={`/inventory/motorcycles/${bike.slug}`}
          className="w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default BikeCard;

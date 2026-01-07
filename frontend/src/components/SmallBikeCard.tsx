import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Cog } from "lucide-react"; 
import type { Bike } from "@/types";


interface SmallBikeCardProps {
  bike: Bike;
}

const SmallBikeCard: React.FC<SmallBikeCardProps> = ({ bike }) => {
  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
  const primaryImage = sortedImages[0];
  
  // Fallback image if no images are available
  const placeholderImage = '/src/assets/motorcycle_images/placeholder.png';

  const thumbnailUrl = primaryImage?.thumbnail || primaryImage?.image || placeholderImage;
  const fullImageUrl = primaryImage?.image || placeholderImage;

  const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;
  const slug = bike.slug;

  // Construct srcset only if there are actual images
  const srcSet = primaryImage ? `${thumbnailUrl} 400w, ${fullImageUrl} 1200w` : '';

  return (
    <Link to={`/inventory/motorcycles/${slug}`} className="block h-full">
      <Card className="w-full overflow-hidden flex flex-col h-full transform transition-transform hover:-translate-y-1 pt-0 border-foreground">
        <div className="relative h-32">
          <img 
            src={thumbnailUrl} 
            srcSet={srcSet}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={cardTitle} 
            className="w-full h-full object-cover" 
            loading="lazy" 
          />
        </div>
        <CardContent className="pt-0 px-2 pb-2 flex-grow flex flex-col justify-between">
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold mb-1">{cardTitle}</h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {bike.engine_size && (
                <div className="flex items-center">
                  <Wrench className="h-4 w-4 mr-1" />
                  <span>{bike.engine_size}cc</span>
                </div>
              )}
              {bike.transmission && (
                <div className="flex items-center">
                  <Cog className="h-4 w-4 mr-1" />
                  <span>{bike.transmission}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-2xl font-bold text-center">
            {bike.discount_price && parseFloat(bike.discount_price) > 0 ? (
              <div className="flex justify-center items-center space-x-2">
                <p className="text-destructive line-through">
                  ${parseFloat(bike.price).toLocaleString()}
                </p>
                <p className="text-primary">
                  ${parseFloat(bike.discount_price).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-primary">
                ${parseFloat(bike.price).toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default SmallBikeCard;

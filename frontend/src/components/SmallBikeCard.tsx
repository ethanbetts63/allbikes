import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Cog } from "lucide-react"; // Import icons
import type { Bike } from "@/types";

interface SmallBikeCardProps {
  bike: Bike;
}

const SmallBikeCard: React.FC<SmallBikeCardProps> = ({ bike }) => {
  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
  const imageUrl = sortedImages[0]?.image || '/src/assets/motorcycle_images/placeholder.png';
  const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

  return (
    <Link to={`/inventory/motorcycles/${bike.id}`} className="block h-full">
      <Card className="w-full overflow-hidden flex flex-col h-full transform transition-transform hover:-translate-y-1 pt-0 border-foreground">
        <div className="relative h-32">
          <img src={imageUrl} alt={cardTitle} className="w-full h-full object-cover" />
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
          <p className="text-2xl font-bold text-primary text-center">
            ${parseFloat(bike.price).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default SmallBikeCard;

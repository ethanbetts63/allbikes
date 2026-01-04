import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import type { Bike } from "@/types"; // Import from shared types

interface SmallBikeCardProps {
  bike: Bike;
}

const SmallBikeCard: React.FC<SmallBikeCardProps> = ({ bike }) => {
  // Sort images by order and get the one with the lowest order number
  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
  const imageUrl = sortedImages[0]?.image || '/src/assets/motorcycle_images/placeholder.png';

  const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

  return (
    <Link to={`/bikes/${bike.id}`} className="block">
      <Card className="w-full overflow-hidden flex flex-col h-full transform transition-transform hover:-translate-y-1 pt-0">
        <div className="relative h-32">
          <img src={imageUrl} alt={cardTitle} className="w-full h-full object-cover"/>
        </div>
        <CardContent className="p-3 flex-grow flex flex-col">
          <h3 className="text-sm font-semibold mb-1 flex-grow">{cardTitle}</h3>
          <p className="text-lg font-bold text-gray-800">
            ${parseFloat(bike.price).toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default SmallBikeCard;

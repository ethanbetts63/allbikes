import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Bike } from "@/types"; // Import from shared types

interface BikeCardProps {
  bike: Bike;
}

const BikeCard: React.FC<BikeCardProps> = ({ bike }) => {
  // Derive imageUrl from the first image in the array, or use a placeholder
  const imageUrl = bike.images[0]?.image || '/src/assets/motorcycle_images/placeholder.png'; // Assuming you have a placeholder image

  const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

  return (
    <Card className="w-full overflow-hidden flex flex-col">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <img src={imageUrl} alt={cardTitle} className="w-full h-full object-cover"/>
          <Badge className="absolute top-2 right-2 capitalize">{bike.condition}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-bold mb-2">{cardTitle}</CardTitle>
        <p className="text-xl font-semibold text-gray-800 mb-4">
          ${parseFloat(bike.price).toLocaleString()}
        </p>
        <div className="text-sm text-gray-600">
          <h3 className="font-semibold mb-1">Specifications:</h3>
          <ul className="list-disc list-inside">
            {bike.year && <li>Year: {bike.year}</li>}
            <li>Odometer: {bike.odometer.toLocaleString()} km</li>
            <li>Engine: {bike.engine_size}cc</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={`/bikes/${bike.id}`} className="w-full">
            <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default BikeCard;
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
  // Sort images by order and get the one with the lowest order number
  const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
  const imageUrl = sortedImages[0]?.image || '/src/assets/motorcycle_images/placeholder.png';

  const cardTitle = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;
  const slug = bike.slug;

  return (
    <Card className="w-full overflow-hidden flex flex-col pt-0 border border-foreground">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <img src={imageUrl} alt={cardTitle} className="w-full h-full object-cover" loading="lazy"/>
          <Badge className="absolute top-2 right-2 capitalize">{bike.condition}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg font-bold mb-2">{cardTitle}</CardTitle>
        <div className="text-xl font-semibold mb-4">
          {bike.discount_price && parseFloat(bike.discount_price) > 0 ? (
            <div className="flex items-center space-x-2">
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
        <div className="text-sm text-gray-600">
          <h3 className="font-semibold mb-0">Specifications:</h3>
          <ul className="list-disc list-inside">
            {bike.year && <li>Year: {bike.year}</li>}
            <li>Odometer: {bike.odometer.toLocaleString()} km</li>
            <li>Engine: {bike.engine_size}cc</li>
          </ul>
        </div>
        {bike.condition === 'new' && (
            <div className="mt-2 text-blue-600 text-m font-semibold">
                {bike.warranty_months && bike.warranty_months > 0
                    ? `Comes with 3 months rego and ${bike.warranty_months} months warranty!`
                    : `Comes with 3 months rego!`
                }
            </div>
        )}
      </CardContent>
      <CardFooter className="px-4 pt-0">
        <Link to={`/inventory/motorcycles/${slug}`} className="w-full">
            <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default BikeCard;
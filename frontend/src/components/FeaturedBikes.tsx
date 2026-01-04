import SmallBikeCard from "@/components/SmallBikeCard";
import type { Bike } from "@/types";

interface FeaturedBikesProps {
  title: string;
  bikes: Bike[];
}

const FeaturedBikes: React.FC<FeaturedBikesProps> = ({ title, bikes }) => {
  if (bikes.length === 0) {
    return null; // Don't render anything if there are no bikes
  }

  return (
    <div className="w-full py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-8 text-[var(--text-primary)]">{title}</h2>
        <div className="flex overflow-x-auto space-x-6 pb-4">
          {bikes.map((bike) => (
            <div key={bike.id} className="flex-shrink-0 w-64">
              <SmallBikeCard bike={bike} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedBikes;

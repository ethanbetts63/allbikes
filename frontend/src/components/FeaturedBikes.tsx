import SmallBikeCard from "@/components/SmallBikeCard";
import type { Bike } from "@/types";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FeaturedBikesProps {
  title: string;
  bikes: Bike[];
  description: string;
  linkTo: string;
  linkText: string;
}

const FeaturedBikes: React.FC<FeaturedBikesProps> = ({ title, bikes, description, linkTo, linkText }) => {
  if (bikes.length === 0) {
    return null; // Don't render anything if there are no bikes
  }

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="w-full pt-4 pb-4">
        <div className="container mx-auto">
          <div className="bg-foreground rounded-lg p-8 flex flex-col md:flex-row items-center">
            {/* Left Column: Title, Description, Button */}
            <div className="md:w-1/5 text-center md:text-left mb-8 md:mb-0">
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-[var(--text-primary)]">{title}</h2>
              <p className="text-lg text-secondary mb-6">{description}</p>
              <Link to={linkTo}>
                <Button className="bg-primary text-primary-foreground font-bold px-6 py-3 text-lg hover:bg-primary/90 flex items-center gap-2 mx-auto md:mx-0">
                  {linkText} <ArrowRight className="h-5" />
                </Button>
              </Link>
            </div>

            {/* Right Column: Scrollable Bike Cards */}
            <div className="md:w-4/5 md:pl-8 flex overflow-x-auto space-x-6 pb-4 hide-scrollbar">
              {bikes.map((bike) => (
                <div key={bike.id} className="flex-shrink-0 w-64">
                  <SmallBikeCard bike={bike} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeaturedBikes;

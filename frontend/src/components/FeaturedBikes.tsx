import SmallBikeCard from "@/components/SmallBikeCard";
import type { FeaturedBikesProps } from "@/types/FeaturedBikesProps";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
      <div className="w-full py-4">
        <div className="container mx-auto">
          <div className="bg-foreground rounded-xl p-8 flex flex-col md:flex-row items-center gap-8">
            {/* Left Column: Title, Description, Button */}
            <div className="md:w-1/5 shrink-0 text-center md:text-left">
              <h2 className="text-2xl font-black tracking-tight mb-2 text-white leading-tight">{title}</h2>
              <p className="text-sm text-stone-200 mb-6 leading-relaxed">{description}</p>
              <Link to={linkTo}>
                <Button className="bg-amber-400 text-stone-900 font-bold px-5 py-2.5 text-sm hover:bg-amber-300 flex items-center gap-1.5 mx-auto md:mx-0">
                  {linkText} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Right Column: Scrollable Bike Cards */}
            <div className="w-full md:w-4/5 flex overflow-x-auto space-x-4 py-3 hide-scrollbar">
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

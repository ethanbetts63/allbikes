import SmallBikeCard from "@/components/SmallBikeCard";
import type { FeaturedBikesProps } from "@/types/FeaturedBikesProps";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FeaturedBikes: React.FC<FeaturedBikesProps> = ({ title, bikes, description, linkTo, linkText }) => {
  if (bikes.length === 0) {
    return null; // Don't render anything if there are no bikes
  }

  const duration = 100;

  return (
    <>
      <style>{`
        @keyframes featured-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .featured-scroll-track {
          animation: featured-scroll ${duration}s linear infinite;
        }
        .featured-scroll-track:hover {
          animation-play-state: paused;
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

            {/* Right Column: Auto-scrolling Bike Cards */}
            <div className="w-full md:w-4/5 overflow-hidden py-3">
              <div className="featured-scroll-track flex gap-4 w-max">
                {/* Duplicated for seamless loop */}
                {[...bikes, ...bikes].map((bike, i) => (
                  <div key={`${bike.id}-${i}`} className="flex-shrink-0 w-64">
                    <SmallBikeCard bike={bike} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeaturedBikes;

import { useState, useEffect, useRef } from "react";
import SmallBikeCard from "@/components/SmallBikeCard";
import type { FeaturedBikesProps } from "@/types/FeaturedBikesProps";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FeaturedBikes: React.FC<FeaturedBikesProps> = ({ title, bikes, description, linkTo, linkText }) => {
  if (bikes.length === 0) {
    return null;
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const scroll = () => {
      if (scrollRef.current) {
        const halfwayPoint = scrollRef.current.scrollWidth / 2;

        positionRef.current += 0.3;

        if (positionRef.current >= halfwayPoint) {
          positionRef.current = 0;
        }

        scrollRef.current.scrollLeft = positionRef.current;
      }
      animationFrameRef.current = requestAnimationFrame(scroll);
    };

    if (!isHovering) {
      positionRef.current = scrollRef.current?.scrollLeft || 0;
      animationFrameRef.current = requestAnimationFrame(scroll);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovering]);

  return (
    <>
      <style>{`
        .featured-no-scrollbar::-webkit-scrollbar { display: none; }
        .featured-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div className="w-full">
        <div className="bg-foreground p-8 flex flex-col md:flex-row items-center gap-8">
            {/* Left Column: Title, Description, Button */}
            <div className="md:w-1/5 shrink-0 text-center md:text-left">
              <h2 className="text-2xl font-black tracking-tight mb-2 text-white leading-tight">{title}</h2>
              <p className="text-sm text-[var(--text-light-secondary)] mb-6 leading-relaxed">{description}</p>
              <Link to={linkTo}>
                <Button className="bg-amber-400 text-[var(--text-dark-primary)] font-bold px-5 py-2.5 text-sm hover:bg-amber-300 flex items-center gap-1.5 mx-auto md:mx-0">
                  {linkText} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Right Column: Auto-scrolling Bike Cards */}
            <div
              ref={scrollRef}
              className="w-full md:w-4/5 overflow-x-auto py-3 featured-no-scrollbar"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="flex gap-4 w-max">
                {[...bikes, ...bikes].map((bike, i) => (
                  <div key={`${bike.id}-${i}`} className="flex-shrink-0 w-64">
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

import SmallBikeCard from "@/components/SmallBikeCard";
import FeaturedBikesCarouselControls from "@/components/FeaturedBikesCarouselControls";
import type { FeaturedBikesProps } from "@/types/FeaturedBikesProps";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FeaturedBikes: React.FC<FeaturedBikesProps> = ({ title, bikes, description, linkTo, linkText }) => {
  const bikeCount = bikes.length;
  const carouselId = `featured-bikes-${linkTo.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`;

  if (bikeCount === 0) {
    return null;
  }

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
              <h2 className="text-2xl font-black tracking-tight mb-2 text-[var(--text-light-primary)] leading-tight">{title}</h2>
              <p className="text-sm text-[var(--text-light-secondary)] mb-6 leading-relaxed">{description}</p>
              <Link href={linkTo}>
                <Button className="bg-highlight text-[var(--text-dark-primary)] font-bold px-5 py-2.5 text-sm hover:bg-highlight/80 flex items-center gap-1.5 mx-auto md:mx-0">
                  {linkText} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Right Column: Scrollable Bike Cards */}
            <div className="relative w-full md:w-4/5">
              <FeaturedBikesCarouselControls targetId={carouselId} label={linkText} />
              <div
                id={carouselId}
                className="w-full overflow-x-auto py-3 featured-no-scrollbar scroll-smooth snap-x snap-mandatory"
              >
                <div className="flex gap-4 w-max">
                  {bikes.map((bike) => (
                    <div key={bike.id} className="flex-shrink-0 w-64 snap-start">
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

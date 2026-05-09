"use client";

import { useRef } from "react";
import SmallBikeCard from "@/components/SmallBikeCard";
import type { FeaturedBikesProps } from "@/types/FeaturedBikesProps";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const FeaturedBikes: React.FC<FeaturedBikesProps> = ({ title, bikes, description, linkTo, linkText }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bikeCount = bikes.length;

  const scrollByCards = (direction: "left" | "right") => {
    const scroller = scrollRef.current;
    if (!scroller) {
      return;
    }

    const cardStep = 272;
    const visibleCards = Math.max(1, Math.floor(scroller.clientWidth / cardStep));
    const distance = visibleCards * cardStep;

    scroller.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

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
              <button
                type="button"
                aria-label={`Scroll ${title} left`}
                onClick={() => scrollByCards("left")}
                className="absolute left-2 top-1/2 z-10 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-foreground/90 text-[var(--text-light-primary)] shadow-lg backdrop-blur transition-colors hover:border-[var(--highlight)] hover:text-[var(--highlight)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-foreground md:left-4"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                type="button"
                aria-label={`Scroll ${title} right`}
                onClick={() => scrollByCards("right")}
                className="absolute right-2 top-1/2 z-10 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-foreground/90 text-[var(--text-light-primary)] shadow-lg backdrop-blur transition-colors hover:border-[var(--highlight)] hover:text-[var(--highlight)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-foreground md:right-4"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
              <div
                ref={scrollRef}
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

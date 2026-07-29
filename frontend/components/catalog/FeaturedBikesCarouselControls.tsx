"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeaturedBikesCarouselControlsProps {
  targetId: string;
  label: string;
}

const scrollByCards = (targetId: string, direction: "left" | "right") => {
  const scroller = document.getElementById(targetId);
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

const FeaturedBikesCarouselControls = ({
  targetId,
  label,
}: FeaturedBikesCarouselControlsProps) => {
  const buttonClass =
    "absolute top-1/2 z-10 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-foreground/90 text-[var(--text-light-primary)] shadow-lg backdrop-blur transition-colors hover:border-[var(--highlight)] hover:text-[var(--highlight)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-foreground";

  return (
    <>
      <button
        type="button"
        aria-label={`Scroll ${label} left`}
        onClick={() => scrollByCards(targetId, "left")}
        className={`${buttonClass} left-2 md:left-4`}
      >
        <ChevronLeft className="h-8 w-8" />
      </button>
      <button
        type="button"
        aria-label={`Scroll ${label} right`}
        onClick={() => scrollByCards(targetId, "right")}
        className={`${buttonClass} right-2 md:right-4`}
      >
        <ChevronRight className="h-8 w-8" />
      </button>
    </>
  );
};

export default FeaturedBikesCarouselControls;

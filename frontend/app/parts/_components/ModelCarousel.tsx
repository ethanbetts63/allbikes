'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  title: ReactNode;
  /**
   * The slides, rendered by the calling server component. Passing them as
   * children rather than mapping a models array here keeps ModelCard — and the
   * static model image map it imports — out of the client bundle.
   */
  children: ReactNode;
};

function ScrollButton({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Scroll ${direction}`}
      className={`group absolute bottom-0 top-0 z-10 hidden w-12 items-center justify-center sm:flex ${
        direction === 'left' ? 'left-0' : 'right-0'
      }`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-black shadow-md transition group-hover:border-black group-hover:bg-black group-hover:text-white group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-black/30">
        <Icon className="h-5 w-5" />
      </span>
    </button>
  );
}

/**
 * A browse-only model row; search results continue to use the regular grid.
 *
 * Scrolling and snapping are pure CSS — the row is fully usable with JS
 * disabled, and on touch it never needs the arrows. The client code here only
 * drives the desktop arrows, which have no CSS equivalent that works outside
 * Chromium today.
 */
export default function ModelCarousel({ title, children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    setCanScrollLeft(element.scrollLeft > 4);
    setCanScrollRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    updateScrollState();
    element.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(element);
    return () => {
      element.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState]);

  function scroll(direction: 1 | -1) {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth, behavior: 'smooth' });
  }

  return (
    <section className="defer-section-sm">
      <h2 className="mb-3 text-lg font-semibold text-black">{title}</h2>

      <div className="relative">
        {canScrollLeft && <ScrollButton direction="left" onClick={() => scroll(-1)} />}

        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:thin]"
        >
          {children}
        </div>

        {canScrollRight && <ScrollButton direction="right" onClick={() => scroll(1)} />}
      </div>
    </section>
  );
}

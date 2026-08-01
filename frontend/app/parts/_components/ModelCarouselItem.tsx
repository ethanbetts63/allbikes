import ModelCard from '@/app/parts/_components/ModelCard';
import type { PartsModelListItem } from '@/types/parts';

/**
 * One slide of a ModelCarousel. Server component on purpose: it is rendered by
 * the page and passed into the client carousel as children, which keeps
 * ModelCard — and the static model image map it imports — out of the browser
 * bundle.
 *
 * Widths are `calc((100% - (n-1) * gap) / n)` for the gap-3 (0.75rem) track:
 * 1-up on mobile, 3-up from sm, 4-up from lg.
 */
export default function ModelCarouselItem({ model }: { model: PartsModelListItem }) {
  return (
    <div className="w-full shrink-0 snap-start sm:w-[calc(33.333%_-_0.5rem)] lg:w-[calc(25%_-_0.5625rem)]">
      <ModelCard model={model} />
    </div>
  );
}

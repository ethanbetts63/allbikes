import type { Bike } from '@/types/Bike';

/** "3 Apr 2026", or "3 Apr 2026 – 7 Apr 2026" when the block spans days. */
export const formatDateRange = (from: string, to: string) => {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  return from === to ? fmt(from) : `${fmt(from)} – ${fmt(to)}`;
};

export const bikeLabel = (bike: Bike) =>
  bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

import { CalendarDays } from 'lucide-react';

import type { Bike } from '@/types/Bike';
import { formatDate } from '@/app/hire/_lib/hire';
import { getPrimaryVehicleImage } from '@/lib/vehicleImages';
import { bikeLabel } from '../_lib/hireBooking';

/** What is being hired, for how long, and what it costs. */
export default function BookingSummaryCard({
  bike, startDate, endDate, numDays, dailyRate, hireTotal, extrasTotal, bondAmount,
}: {
  bike: Bike;
  startDate: string;
  endDate: string;
  numDays: number;
  /** Null when the bike has no rate configured. */
  dailyRate: number | null;
  hireTotal: number | null;
  extrasTotal: number;
  bondAmount: number | null;
}) {
  const imageUrl = getPrimaryVehicleImage(bike.images, 'card');
  const name = bikeLabel(bike);

  return (
    <div className="bg-[var(--bg-light-secondary)] border border-[var(--border-light)] rounded-lg p-4">
      {imageUrl && (
        <img src={imageUrl} alt={name} className="w-full aspect-[4/3] object-contain rounded-md mb-4" />
      )}
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">
        {bike.make}
      </p>
      <p className="font-bold text-[var(--text-dark-primary)] text-lg mb-3">{name}</p>
      <div className="flex items-center gap-2 text-[var(--text-dark-secondary)] mb-4">
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span className="text-sm">{formatDate(startDate)} — {formatDate(endDate)}</span>
      </div>
      <div className="border-t border-[var(--border-light)] pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--text-dark-secondary)]">Daily rate</span>
          <span className="text-[var(--text-dark-primary)]">
            {dailyRate !== null ? `$${dailyRate.toFixed(2)}` : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-dark-secondary)]">Duration</span>
          <span className="text-[var(--text-dark-primary)]">
            {numDays} {numDays === 1 ? 'day' : 'days'}
          </span>
        </div>
        <div className="flex justify-between border-t border-[var(--border-light)] pt-2">
          <span>Hire total</span>
          <span>{hireTotal !== null ? `$${hireTotal.toFixed(2)}` : '—'}</span>
        </div>
        {extrasTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-[var(--text-dark-secondary)]">Extras</span>
            <span>${extrasTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t border-[var(--border-light)] pt-2">
          <span>Total charged today</span>
          <span>{hireTotal !== null ? `$${(hireTotal + extrasTotal).toFixed(2)}` : '—'}</span>
        </div>
        {bondAmount !== null && bondAmount > 0 && (
          <div className="flex justify-between text-[var(--text-dark-secondary)] text-xs pt-1">
            <span>Bond due at pickup (in-store)</span>
            <span>${bondAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

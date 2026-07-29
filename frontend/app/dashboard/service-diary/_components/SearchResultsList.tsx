import { format } from 'date-fns';

import type { Booking } from '@/types/Booking';
import { STATUS_STYLES } from '@/lib/bookingStatus';
import { formatTime, vehicleLabel } from '../_lib/diary';

/** Flat results list shown instead of the week grid while a search is active. */
export default function SearchResultsList({ results, isSearching, onOpen }: {
  results: Booking[];
  isSearching: boolean;
  onOpen: (id: number) => void;
}) {
  if (isSearching && results.length === 0) {
    return <p className="text-sm text-[var(--text-dark-secondary)] py-8 text-center">Searching…</p>;
  }
  if (results.length === 0) {
    return <p className="text-sm text-[var(--text-dark-secondary)] py-8 text-center">No bookings match your search.</p>;
  }
  return (
    <div className="border border-[var(--border-light)] rounded-lg overflow-hidden bg-white">
      {results.map(b => {
        const style = STATUS_STYLES[b.status];
        const bike = vehicleLabel(b);
        return (
          <button
            key={b.id}
            onClick={() => onOpen(b.id)}
            className="w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
          >
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${style.dot}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-semibold text-gray-900">{b.customer_name}</span>
                {b.customer_phone && <span className="text-xs text-gray-500">{b.customer_phone}</span>}
              </div>
              {(bike || b.registration) && (
                <p className="text-xs text-gray-700">
                  {bike}
                  {b.registration && <span className="font-mono text-gray-500"> · {b.registration}</span>}
                </p>
              )}
              {b.job_description && <p className="text-xs text-gray-500 truncate">{b.job_description}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-gray-800">
                {format(new Date(b.drop_off_date + 'T00:00:00'), 'EEE d MMM yyyy')}
              </p>
              <p className="text-xs text-gray-500">{formatTime(b.drop_off_time) ?? 'No time'} · {style.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

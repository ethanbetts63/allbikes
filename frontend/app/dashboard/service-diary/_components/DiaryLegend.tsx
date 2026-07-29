import { BOOKING_STATUSES } from '@/app/dashboard/service-diary/_lib/bookingStatus';

/** What each tile colour and the grey day shading mean. */
export default function DiaryLegend() {
  return (
    <div className="flex flex-wrap gap-4 mt-4 text-xs text-[var(--text-dark-secondary)]">
      {BOOKING_STATUSES.map(s => (
        <span key={s.value} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm bg-gray-300" /> Unavailable / blocked
      </span>
    </div>
  );
}

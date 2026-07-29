import type { Booking } from '@/types/Booking';
import { STATUS_STYLES } from '@/app/dashboard/service-diary/_lib/bookingStatus';
import { formatTime, vehicleLabel } from '../_lib/diary';

/** One job in a day column. Clicking it opens the action menu. */
export default function BookingTile({ booking, onClick }: {
  booking: Booking;
  onClick: (e: React.MouseEvent) => void;
}) {
  const style = STATUS_STYLES[booking.status];
  const time = formatTime(booking.drop_off_time);
  const bike = vehicleLabel(booking);
  const cancelled = booking.status === 'cancelled';
  return (
    <button
      onClick={onClick}
      aria-haspopup="menu"
      className={`w-full text-left border-b border-black/10 p-2.5 transition-colors ${style.tile}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
        <span className={`text-xs font-bold text-gray-800 ${cancelled ? 'line-through' : ''}`}>{time ?? 'No time'}</span>
        {cancelled && <span className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Cancelled</span>}
      </div>
      {(bike || booking.registration) && (
        <p className={`text-xs font-semibold text-gray-900 leading-snug ${cancelled ? 'line-through' : ''}`}>
          {bike}
          {booking.registration && <span className="font-mono font-normal text-gray-600"> · {booking.registration}</span>}
        </p>
      )}
      <p className="text-xs text-gray-700 leading-snug">
        {booking.customer_name}
        {booking.customer_phone && <span className="text-gray-500"> · {booking.customer_phone}</span>}
      </p>
      {booking.job_description && (
        <p className="text-[11px] text-gray-500 leading-snug mt-1">{booking.job_description}</p>
      )}
    </button>
  );
}

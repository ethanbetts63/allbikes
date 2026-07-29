import { formatDate } from '@/utils/formatting';
import type { HireBooking } from '@/types/HireBooking';
import DetailRow from './DetailRow';
import { hireDays } from '../_lib/hireStatus';

/** What was hired, for how long, and what it cost. */
export default function HireBookingDetails({ booking }: { booking: HireBooking }) {
  const days = hireDays(booking.hire_start, booking.hire_end);
  return (
    <div className="mb-6">
      <h2 className="font-bold mb-2">Hire Details</h2>
      <DetailRow label="Motorcycle" value={booking.motorcycle_name} />
      <DetailRow label="Start Date" value={booking.hire_start} />
      <DetailRow label="End Date" value={booking.hire_end} />
      <DetailRow label="Duration" value={`${days} day${days !== 1 ? 's' : ''}`} />
      <DetailRow label="Daily Rate" value={`$${parseFloat(booking.effective_daily_rate).toFixed(2)}`} />
      <DetailRow label="Hire Total" value={`$${parseFloat(booking.total_hire_amount).toFixed(2)}`} />
      <DetailRow label="Bond" value={`$${parseFloat(booking.bond_amount).toFixed(2)}`} />
      <DetailRow label="Booked" value={formatDate(booking.created_at)} />
    </div>
  );
}

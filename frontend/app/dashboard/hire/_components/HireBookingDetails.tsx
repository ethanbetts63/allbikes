import { formatDate } from '@/utils/formatting';
import type { HireBooking } from '@/types/HireBooking';
import DetailRow from '@/components/ui/detail-row';
import { hireDays } from '../_lib/hireStatus';

/** What was hired, for how long, and what it cost. */
export default function HireBookingDetails({ booking }: { booking: HireBooking }) {
  const days = hireDays(booking.hire_start, booking.hire_end);
  return (
    <div className="mb-6">
      <h2 className="font-bold mb-2">Hire Details</h2>
      <DetailRow labelWidth="w-40" label="Motorcycle" value={booking.motorcycle_name} />
      <DetailRow labelWidth="w-40" label="Start Date" value={booking.hire_start} />
      <DetailRow labelWidth="w-40" label="End Date" value={booking.hire_end} />
      <DetailRow labelWidth="w-40" label="Duration" value={`${days} day${days !== 1 ? 's' : ''}`} />
      <DetailRow labelWidth="w-40" label="Daily Rate" value={`$${parseFloat(booking.effective_daily_rate).toFixed(2)}`} />
      <DetailRow labelWidth="w-40" label="Hire Total" value={`$${parseFloat(booking.total_hire_amount).toFixed(2)}`} />
      <DetailRow labelWidth="w-40" label="Bond" value={`$${parseFloat(booking.bond_amount).toFixed(2)}`} />
      <DetailRow labelWidth="w-40" label="Booked" value={formatDate(booking.created_at)} />
    </div>
  );
}

import type { HireBooking } from '@/types/HireBooking';
import DetailRow from './DetailRow';

/** Who the booking is for. */
export default function HireBookingCustomer({ booking }: { booking: HireBooking }) {
  return (
    <div className="mb-6">
      <h2 className="font-bold mb-2">Customer</h2>
      <DetailRow label="Name" value={booking.customer_name} />
      <DetailRow label="Email" value={booking.customer_email} />
      <DetailRow label="Phone" value={booking.customer_phone} />
    </div>
  );
}

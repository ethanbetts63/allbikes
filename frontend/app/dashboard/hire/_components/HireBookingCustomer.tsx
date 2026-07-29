import type { HireBooking } from '@/types/HireBooking';
import DetailRow from '@/components/ui/detail-row';

/** Who the booking is for. */
export default function HireBookingCustomer({ booking }: { booking: HireBooking }) {
  return (
    <div className="mb-6">
      <h2 className="font-bold mb-2">Customer</h2>
      <DetailRow labelWidth="w-40" label="Name" value={booking.customer_name} />
      <DetailRow labelWidth="w-40" label="Email" value={booking.customer_email} />
      <DetailRow labelWidth="w-40" label="Phone" value={booking.customer_phone} />
    </div>
  );
}

import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import type { NotificationHireBooking } from '@/types/AdminNotifications';
import NotificationSection, { HEAD_ROW, ROW, TABLE_PANEL, TD_MUTED, TH } from './NotificationSection';

const HIRE_STATUS_BADGE: Record<string, string> = {
  confirmed: 'border-green-600 text-green-700',
  active: 'border-blue-500 text-blue-700',
};

/** Hire bookings that are confirmed or currently out. */
export default function HireBookings({ bookings }: { bookings: NotificationHireBooking[] }) {
  const router = useRouter();
  return (
    <NotificationSection title="Hire bookings" count={bookings.length}>
      <div className={TABLE_PANEL}>
        <table className="w-full text-sm">
          <thead>
            <tr className={HEAD_ROW}>
              <th className={TH}>Reference</th>
              <th className={TH}>Motorcycle</th>
              <th className={TH}>Customer</th>
              <th className={TH}>Dates</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {bookings.map(booking => (
              <tr key={booking.id} onClick={() => router.push(`/dashboard/hire/${booking.id}`)} className={ROW}>
                <td className="px-4 py-3 font-mono font-semibold text-[var(--text-dark-primary)]">
                  {booking.booking_reference}
                </td>
                <td className={TD_MUTED}>{booking.motorcycle_name}</td>
                <td className={TD_MUTED}>{booking.customer_name}</td>
                <td className={TD_MUTED}>{booking.hire_start} → {booking.hire_end}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-xs ${HIRE_STATUS_BADGE[booking.status] ?? ''}`}>
                    {booking.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </NotificationSection>
  );
}

import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { HireBooking } from '@/types/HireBooking';
import { statusBadgeClass } from '../_lib/hireStatus';

/** Bookings list. Clicking a row opens it; Delete is stopPropagation'd. */
export default function HireBookingsTable({ bookings, onDelete }: {
  bookings: HireBooking[];
  onDelete: (booking: HireBooking) => void;
}) {
  const router = useRouter();
  return (
    <div className="bg-[var(--bg-light-primary)] rounded-lg border border-border-light overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-light text-xs text-[var(--text-dark-secondary)] uppercase tracking-wider">
            <th className="text-left px-4 py-3 font-semibold">Reference</th>
            <th className="text-left px-4 py-3 font-semibold">Motorcycle</th>
            <th className="text-left px-4 py-3 font-semibold">Customer</th>
            <th className="text-left px-4 py-3 font-semibold">Dates</th>
            <th className="text-left px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {bookings.map(booking => (
            <tr
              key={booking.id}
              onClick={() => router.push(`/dashboard/hire/${booking.id}`)}
              className="hover:bg-[var(--bg-light-secondary)] cursor-pointer transition-colors"
            >
              <td className="px-4 py-3 font-mono font-semibold text-[var(--text-dark-primary)]">
                {booking.booking_reference}
              </td>
              <td className="px-4 py-3 text-[var(--text-dark-secondary)]">{booking.motorcycle_name}</td>
              <td className="px-4 py-3 text-[var(--text-dark-secondary)]">{booking.customer_name}</td>
              <td className="px-4 py-3 text-[var(--text-dark-secondary)]">
                {booking.hire_start} → {booking.hire_end}
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline" className={`text-xs ${statusBadgeClass(booking.status)}`}>
                  {booking.status.replace('_', ' ')}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); onDelete(booking); }}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
          {bookings.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-dark-secondary)]">
                No bookings found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

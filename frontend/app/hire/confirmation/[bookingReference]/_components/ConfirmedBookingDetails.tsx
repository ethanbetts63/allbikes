import { formatDate } from '@/lib/hire';
import type { HireBooking } from '@/types/HireBooking';

/** Reference, dates and the payment breakdown for a confirmed booking. */
export default function ConfirmedBookingDetails({ booking }: { booking: HireBooking }) {
  const bondAmount = parseFloat(booking.bond_amount);
  // Hire + extras only; the bond is collected in store, not charged here.
  const totalCharged = parseFloat(booking.total_charged);

  return (
    <>
      <div className="bg-[var(--bg-light-secondary)] border border-[var(--border-light)] rounded-lg p-5 mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-1">
          Booking Reference
        </p>
        <p className="text-2xl font-black text-[var(--text-dark-primary)] font-mono tracking-wider">
          {booking.booking_reference}
        </p>
        <p className="text-xs text-[var(--text-dark-secondary)] mt-1">Keep this for your records</p>
      </div>

      <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg divide-y divide-stone-100 mb-8">
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
            Motorcycle
          </p>
          <p className="font-bold text-[var(--text-dark-primary)]">{booking.motorcycle_name}</p>
        </div>

        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
            Hire Period
          </p>
          <p className="text-[var(--text-dark-primary)] text-sm">
            {formatDate(booking.hire_start)} — {formatDate(booking.hire_end)}
          </p>
          <p className="text-[var(--text-dark-secondary)] text-sm">
            {booking.num_days} {booking.num_days === 1 ? 'day' : 'days'}
          </p>
        </div>

        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
            Payment
          </p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-[var(--text-dark-secondary)]">
              <span>Hire</span>
              <span>${parseFloat(booking.total_hire_amount).toFixed(2)}</span>
            </div>
            {(booking.extras ?? []).map((extra) => (
              <div key={extra.id} className="flex justify-between text-[var(--text-dark-secondary)]">
                <span>{extra.name} ×{extra.quantity}</span>
                <span>${parseFloat(extra.total_amount).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-[var(--text-dark-primary)] pt-1 border-t border-[var(--border-light)]">
              <span>Total charged today</span>
              <span>${totalCharged.toFixed(2)}</span>
            </div>
            {bondAmount > 0 && (
              <div className="flex justify-between text-[var(--text-dark-secondary)] text-xs pt-1">
                <span>Bond due at pickup (in-store)</span>
                <span>${bondAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

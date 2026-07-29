import { formatDate } from '@/app/hire/_lib/hire';
import type { HireBooking } from '@/types/HireBooking';

/** What the customer has to do and bring, plus the shop's hours. */
export default function PickupInstructions({ booking }: { booking: HireBooking }) {
  const bondAmount = parseFloat(booking.bond_amount);

  return (
    <>
      {bondAmount > 0 && (
        <div className="border border-[var(--highlight)] rounded-lg p-4 mb-6 text-sm">
          <p className="font-bold text-[var(--text-dark-primary)] mb-1">
            Bond required at pickup — ${bondAmount.toFixed(2)}
          </p>
          <p className="text-[var(--text-dark-secondary)]">
            A refundable bond will be collected in-store when you pick up the bike. Please bring a card
            or cash. It will be returned in full when the bike is back with us in good condition.
          </p>
        </div>
      )}

      <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg p-5 mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-3">
          Pick-up &amp; Drop-off
        </p>
        <div className="space-y-3 text-sm text-[var(--text-dark-secondary)]">
          <p>
            <span className="font-semibold text-[var(--text-dark-primary)]">Pick-up — </span>
            Collect your bike any time we are open on{' '}
            <span className="font-semibold text-[var(--text-dark-primary)]">{formatDate(booking.hire_start)}</span>.
          </p>
          <p>
            <span className="font-semibold text-[var(--text-dark-primary)]">Drop-off — </span>
            Return the bike by at least 2 hours before closing time on{' '}
            <span className="font-semibold text-[var(--text-dark-primary)]">{formatDate(booking.hire_end)}</span>.
          </p>
          <div className="pt-2 border-t border-[var(--border-light)]">
            <p className="font-semibold text-[var(--text-dark-primary)] mb-1">
              Unit 5 / 6 Cleveland Street, Dianella WA 6059
            </p>
            <p>Mon – Fri: 9:00 AM – 5:00 PM</p>
            <p>Sat: 10:00 AM – 1:00 PM</p>
            <p>Sun: Closed</p>
          </div>
        </div>
      </div>
    </>
  );
}

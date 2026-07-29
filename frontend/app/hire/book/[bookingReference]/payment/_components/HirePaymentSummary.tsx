import { CalendarDays } from 'lucide-react';

import { formatDate } from '@/lib/hire';
import type { HireBookingSummary } from '@/types/HireBookingSummary';

/** What is being paid for, and what is still owed at pickup. */
export default function HirePaymentSummary({ summary }: { summary: HireBookingSummary }) {
  const bondAmount = parseFloat(summary.bondAmount);
  const extrasTotal = parseFloat(summary.extrasTotal);

  return (
    <div className="bg-[var(--bg-light-secondary)] border border-[var(--border-light)] rounded-lg p-4 mb-8">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-1">
        Hire Booking
      </p>
      <p className="font-bold text-[var(--text-dark-primary)] text-base mb-2">{summary.motorcycleName}</p>
      <div className="flex items-center gap-2 text-[var(--text-dark-secondary)] mb-3">
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span className="text-sm">{formatDate(summary.hireStart)} — {formatDate(summary.hireEnd)}</span>
      </div>
      <div className="border-t border-[var(--border-light)] pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-[var(--text-dark-secondary)]">
          <span>Hire total ({summary.numDays} {summary.numDays === 1 ? 'day' : 'days'})</span>
          <span>${parseFloat(summary.totalHireAmount).toFixed(2)}</span>
        </div>
        {extrasTotal > 0 && (
          <div className="flex justify-between text-[var(--text-dark-secondary)]">
            <span>Extras</span>
            <span>${extrasTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-[var(--text-dark-primary)] border-t border-[var(--border-light)] pt-2">
          <span>Total charged today</span>
          <span>${parseFloat(summary.totalCharged).toFixed(2)}</span>
        </div>
        {bondAmount > 0 && (
          <div className="flex justify-between text-[var(--text-dark-secondary)] text-xs pt-1">
            <span>Bond due at pickup (in-store)</span>
            <span>${bondAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

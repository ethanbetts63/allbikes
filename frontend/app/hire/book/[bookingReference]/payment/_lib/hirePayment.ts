import type { HireBooking } from '@/types/HireBooking';
import type { HireBookingSummary } from '@/types/HireBookingSummary';

/** Flattens a booking into the figures shown above the payment form. */
export function buildSummaryFromBooking(booking: HireBooking): HireBookingSummary {
  return {
    motorcycleName: booking.motorcycle_name,
    hireStart: booking.hire_start,
    hireEnd: booking.hire_end,
    numDays: booking.num_days,
    totalHireAmount: booking.total_hire_amount,
    bondAmount: booking.bond_amount,
    extrasTotal: booking.extras
      .reduce((total, extra) => total + parseFloat(extra.total_amount), 0)
      .toFixed(2),
    totalCharged: booking.total_charged,
  };
}

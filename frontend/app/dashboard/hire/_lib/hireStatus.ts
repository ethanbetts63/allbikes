/** Statuses an operator can move a hire booking to. */
export const STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** The same list with an "All" entry, for filtering the bookings table. */
export const FILTER_STATUS_OPTIONS = [{ value: '', label: 'All' }, ...STATUS_OPTIONS];

export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending Payment', className: 'border-amber-500 text-[var(--highlight)]' },
  confirmed:       { label: 'Confirmed',       className: 'border-green-600 text-green-700' },
  active:          { label: 'Active',          className: 'border-blue-500 text-blue-700' },
  returned:        { label: 'Returned',        className: 'text-[var(--text-dark-secondary)] border-gray-400' },
  cancelled:       { label: 'Cancelled',       className: 'border-red-500 text-destructive' },
};

/** Just the badge colours, for places that render the raw status text. */
export const statusBadgeClass = (status: string) => STATUS_BADGE[status]?.className ?? '';

/** Whole days between the two dates, as shown on the booking. */
export const hireDays = (start: string, end: string) =>
  Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));

/** Statuses an operator can move a shop order to. */
export const STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid',            label: 'Paid' },
  { value: 'completed',       label: 'Completed' },
  { value: 'cancelled',       label: 'Cancelled' },
  { value: 'refunded',        label: 'Refunded' },
];

export const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending Payment', className: 'border-amber-500 text-[var(--highlight)]' },
  paid:            { label: 'Paid',            className: 'border-green-600 text-highlight1' },
  completed:       { label: 'Completed',       className: 'text-[var(--text-dark-secondary)] border-gray-400' },
  cancelled:       { label: 'Cancelled',       className: 'border-red-500 text-destructive' },
  refunded:        { label: 'Refunded',        className: 'border-orange-500 text-orange-600' },
};

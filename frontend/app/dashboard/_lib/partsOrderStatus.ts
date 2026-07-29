/** Outline badge colours shared by the parts-orders and notifications routes. */
export const PARTS_STATUS_BADGE: Record<string, string> = {
  pending_payment: 'border-amber-500 text-[var(--highlight)]',
  paid: 'border-green-600 text-green-700',
  dispatched: 'border-blue-500 text-blue-700',
  completed: 'border-emerald-600 text-emerald-700',
  cancelled: 'border-red-500 text-destructive',
  refunded: 'border-orange-500 text-orange-600',
  partially_refunded: 'border-orange-400 text-orange-500',
};

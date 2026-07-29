import type { AdminPartsOrderItem } from '@/types/partsAdmin';

/** Statuses an operator can move an order to, in workflow order. */
export const ORDER_STATUSES = [
  'pending_payment', 'paid', 'dispatched', 'completed', 'cancelled', 'refunded', 'partially_refunded',
];

/** Outline badge colours per order status, used by the list and notifications pages. */
export const PARTS_STATUS_BADGE: Record<string, string> = {
  pending_payment: 'border-amber-500 text-[var(--highlight)]',
  paid: 'border-green-600 text-green-700',
  dispatched: 'border-blue-500 text-blue-700',
  completed: 'border-emerald-600 text-emerald-700',
  cancelled: 'border-red-500 text-destructive',
  refunded: 'border-orange-500 text-orange-600',
  partially_refunded: 'border-orange-400 text-orange-500',
};

// Outline buttons on the light order-detail surface need explicit colours
// (the dark-dashboard variant leaves them unreadable). Filled slate rather than
// white-on-white so they stay visible against the light card background;
// the base button's disabled:opacity-50 still reads as disabled.
export const BTN_INACTIVE =
  'bg-slate-600 text-white border-slate-700 hover:bg-slate-700 hover:text-white';

// Accent + tint for the order status banner. Unpaid and cancelled read as
// warnings because they change what the operator is allowed to do next.
export const ORDER_STATUS_BANNER: Record<string, string> = {
  pending_payment: 'border-l-amber-500 bg-amber-50 text-amber-900',
  paid: 'border-l-green-600 bg-green-50 text-green-900',
  dispatched: 'border-l-blue-500 bg-blue-50 text-blue-900',
  completed: 'border-l-emerald-600 bg-emerald-50 text-emerald-900',
  cancelled: 'border-l-red-500 bg-red-50 text-red-900',
  refunded: 'border-l-orange-500 bg-orange-50 text-orange-900',
  partially_refunded: 'border-l-orange-400 bg-orange-50 text-orange-900',
};

// Whole-row tint + legend swatch per line state, mirroring the orders list page.
// A line carries two axes — its own status and the backorder flag — but a row has
// one colour, so backorder folds into the same key. Without that a backordered
// line would look identical to an untouched one.
export const ITEM_STATE_STYLE: Record<string, { row: string; swatch: string; label: string }> = {
  overdue: { row: 'bg-red-50 hover:bg-red-100', swatch: 'bg-red-400', label: 'Backorder overdue' },
  backordered: { row: 'bg-orange-50 hover:bg-orange-100', swatch: 'bg-orange-300', label: 'On backorder' },
  to_order: { row: 'bg-slate-50 hover:bg-slate-100', swatch: 'bg-slate-300', label: 'To order' },
  completed: { row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Completed' },
  refunded: { row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Refunded' },
};

/** Legend order = most actionable first, matching the list page's convention. */
export const ITEM_LEGEND_ORDER = ['overdue', 'backordered', 'to_order', 'completed', 'refunded'];

/** The single state a row is tinted by. Settled outcomes win over backorder. */
export function itemState(item: AdminPartsOrderItem, daysRemaining: number): string {
  if (item.status === 'refunded' || item.status === 'completed') return item.status;
  if (item.backordered) return daysRemaining < 0 ? 'overdue' : 'backordered';
  return 'to_order';
}

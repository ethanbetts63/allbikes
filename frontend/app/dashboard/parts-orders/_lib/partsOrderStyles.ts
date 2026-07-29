import type { AdminPartsOrderItem } from '@/app/dashboard/parts-orders/_lib/partsAdmin';

/** Statuses an operator can move an order to, in workflow order. */
export const ORDER_STATUSES = [
  'pending_payment', 'paid', 'dispatched', 'completed', 'cancelled', 'refunded', 'partially_refunded',
];

/** Shared list-row presentation and actionable ordering for order statuses. */
export const ORDER_STATUS_STYLE: Record<string, { row: string; swatch: string; label: string }> = {
  paid: { row: 'bg-sky-50 hover:bg-sky-100', swatch: 'bg-sky-300', label: 'Paid — to dispatch' },
  dispatched: { row: 'bg-indigo-50 hover:bg-indigo-100', swatch: 'bg-indigo-300', label: 'Dispatched' },
  completed: { row: 'bg-emerald-50 hover:bg-emerald-100', swatch: 'bg-emerald-300', label: 'Completed' },
  pending_payment: { row: 'bg-amber-50 hover:bg-amber-100', swatch: 'bg-amber-300', label: 'Pending payment' },
  partially_refunded: { row: 'bg-orange-50 hover:bg-orange-100', swatch: 'bg-orange-300', label: 'Partially refunded' },
  refunded: { row: 'bg-rose-50 hover:bg-rose-100', swatch: 'bg-rose-300', label: 'Refunded' },
  cancelled: { row: 'bg-slate-100 hover:bg-slate-200', swatch: 'bg-slate-400', label: 'Cancelled' },
};

export const ORDER_LEGEND_ORDER = [
  'paid', 'dispatched', 'partially_refunded', 'pending_payment', 'completed', 'refunded', 'cancelled',
];

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

/** Filter choices on the orders list. */
export const ORDER_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'paid,dispatched', label: 'To Do (paid + dispatched)' },
  { value: 'pending_payment', label: 'Pending payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'completed', label: 'Completed' },
  { value: 'partially_refunded', label: 'Partially refunded' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
];

/** "partially_refunded" -> "Partially Refunded". */
export const humanizeStatus = (v: string) =>
  v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export type SortField = 'customer_name' | 'total' | 'status' | 'created_at';
export interface Sort { field: SortField; dir: 'asc' | 'desc'; }

export const PAGE_SIZE = 50;

/** Legend order = most actionable first, matching the list page's convention. */
export const ITEM_LEGEND_ORDER = ['overdue', 'backordered', 'to_order', 'completed', 'refunded'];

/** The single state a row is tinted by. Settled outcomes win over backorder. */
export function itemState(item: AdminPartsOrderItem, daysRemaining: number): string {
  if (item.status === 'refunded' || item.status === 'completed') return item.status;
  if (item.backordered) return daysRemaining < 0 ? 'overdue' : 'backordered';
  return 'to_order';
}

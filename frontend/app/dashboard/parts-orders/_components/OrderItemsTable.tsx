import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { AdminPartsOrder, AdminPartsOrderItem, ItemAction } from '@/app/dashboard/parts-orders/_lib/partsAdmin';
import { ITEM_LEGEND_ORDER, ITEM_STATE_STYLE, itemState } from '../_lib/partsOrderStyles';

/**
 * The order's lines, tinted by state with a colour key above.
 *
 * There is no status column: the row colour carries it, which keeps the two
 * per-line controls (backorder, refund) the only thing competing for attention.
 */
export default function OrderItemsTable({ order, busy, onItemAction }: {
  order: AdminPartsOrder;
  busy: boolean;
  onItemAction: (itemId: number, action: ItemAction) => void;
}) {
  return (
    <>
      <h2 className="mb-2 font-bold">Items</h2>

      {/* Colour key */}
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--text-dark-secondary)]">
        <span className="font-medium text-[var(--text-dark-primary)]">Row colour:</span>
        {ITEM_LEGEND_ORDER.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm ${ITEM_STATE_STYLE[s].swatch}`} />
            {ITEM_STATE_STYLE[s].label}
          </span>
        ))}
      </div>

      <div className="mb-6 overflow-x-auto rounded-md border border-border-light">
        <Table>
          <TableHeader>
            <TableRow className="border-border-light">
              <TableHead className="text-[var(--text-dark-primary)]">Part</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Qty</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">RRP + GST</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Customer paid</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Actual cost</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Profit ex GST</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Margin</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                busy={busy}
                daysRemaining={order.backorder_days_remaining}
                windowExpired={order.backorder_window_expired}
                holdDays={order.backorder_hold_days}
                onAction={onItemAction}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function ItemRow({ item, busy, daysRemaining, windowExpired, holdDays, onAction }: {
  item: AdminPartsOrderItem;
  busy: boolean;
  /** Days left in the hold for the whole order; zero or negative means closed. */
  daysRemaining: number;
  windowExpired: boolean;
  holdDays: number;
  onAction: (itemId: number, action: ItemAction) => void;
}) {
  const btn = 'rounded border border-gray-300 px-2 py-1 text-xs hover:border-black disabled:opacity-40';
  const settled = item.status === 'refunded' || item.status === 'completed';
  const daysOld = holdDays - daysRemaining;
  const state = ITEM_STATE_STYLE[itemState(item, daysRemaining)];
  return (
    <TableRow className={`border-border-light align-top ${state.row}`}>
      <TableCell>
        {/* The row tint carries the state visually; this keeps it available to
            screen readers, which cannot see the colour key. */}
        <span className="sr-only">Status: {state.label}. </span>
        <div className="font-mono text-sm">{item.part_number}</div>
        <div className="text-xs text-[var(--text-dark-secondary)]">
          {item.description}{item.colour_name ? ` · ${item.colour_name}` : ''}
        </div>
        <div className="text-xs text-[var(--text-dark-secondary)]">
          {item.model_name} · {item.section_code} #{item.ref_number}
        </div>
      </TableCell>
      <TableCell className="text-sm">{item.quantity}</TableCell>
      <TableCell className="text-sm whitespace-nowrap text-[var(--text-dark-secondary)]">
        {item.rrp_line_total_incl_gst == null ? '—' : `$${item.rrp_line_total_incl_gst}`}
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap">
        <div>${item.line_total}</div>
        {item.markup_percentage != null && (
          <div className="text-xs text-[var(--text-dark-secondary)]">+{item.markup_percentage}% markup</div>
        )}
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap text-[var(--text-dark-secondary)]">
        <div>{item.supplier_line_total_incl_gst == null ? '—' : `$${item.supplier_line_total_incl_gst}`}</div>
        {item.supplier_discount_percentage != null && (
          <div className="text-xs">−{item.supplier_discount_percentage}% discount</div>
        )}
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap font-medium text-emerald-700">
        {item.gross_profit_ex_gst == null ? '—' : `$${item.gross_profit_ex_gst}`}
      </TableCell>
      <TableCell className="text-sm whitespace-nowrap font-medium text-emerald-700">
        {item.profit_margin_percentage == null ? '—' : `${item.profit_margin_percentage}%`}
      </TableCell>
      <TableCell>
        {/* The colour says "on backorder"; only the countdown carries the number,
            so it stays next to the buttons the operator is deciding between.
            A settled line has nothing left to wait for. */}
        {item.backordered && !settled && (
          <div className={`mb-1 text-xs font-medium ${daysRemaining < 0 ? 'text-red-600' : 'text-orange-600'}`}>
            {daysRemaining < 0 ? `${-daysRemaining}d overdue` : `${daysRemaining}d left`}
          </div>
        )}
        <div className="flex flex-wrap gap-1">
          {!settled && (
            <>
              {item.backordered ? (
                <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'remove_backorder')}>Remove backorder</button>
              ) : (
                <button
                  className={btn}
                  disabled={busy || windowExpired}
                  onClick={() => onAction(item.id, 'place_backorder')}
                >
                  Place on backorder
                </button>
              )}
              <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'mark_refunded')}>Refund</button>
            </>
          )}
          {item.status === 'refunded' && (
            <button className={btn} disabled={busy} onClick={() => onAction(item.id, 'mark_to_order')}>Undo</button>
          )}
        </div>
        {!settled && !item.backordered && windowExpired && (
          <p className="mt-1 w-48 whitespace-normal text-xs italic text-[var(--text-dark-secondary)]">
            Order is {daysOld}d old; exceeds the {holdDays}-day backorder window. Refund instead.
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}

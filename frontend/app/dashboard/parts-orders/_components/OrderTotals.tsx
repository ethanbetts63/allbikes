import type { AdminPartsOrder } from '@/app/dashboard/parts-orders/_lib/partsAdmin';

/** What the customer paid, beside the margin figures only staff see. */
export default function OrderTotals({ order }: { order: AdminPartsOrder }) {
  return (
    <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:max-w-2xl">
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--text-dark-secondary)]">Subtotal</span><span>${order.subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-dark-secondary)]">Shipping</span><span>${order.shipping}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total </span><span>${order.amount_paid ?? order.total}</span>
        </div>
      </div>

      <div className="rounded-md border border-border-light p-3 text-sm">
        <h3 className="mb-1 font-bold">Internal margin (ex GST)</h3>
        <p className="mb-2 text-xs text-[var(--text-dark-secondary)]">
          Checkout price snapshots. Parts only — shipping excluded.
        </p>
        <div className="flex justify-between">
          <span className="text-[var(--text-dark-secondary)]">Customer parts total</span>
          <span>${order.margin.customer_parts_total_incl_gst.toFixed(2)} incl. GST</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--text-dark-secondary)]">Actual supplier cost</span>
          <span>${order.margin.supplier_parts_total_incl_gst.toFixed(2)} incl. GST</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-border-light pt-1 font-bold text-emerald-700">
          <span>Gross profit (GST removed)</span>
          <span>${order.margin.gross_profit_ex_gst_total.toFixed(2)} ex GST</span>
        </div>
        <div className="flex justify-between font-medium text-emerald-700">
          <span>Profit margin</span><span>{order.margin.profit_margin_percentage.toFixed(2)}%</span>
        </div>
        {order.margin.has_unpriced_items && (
          <p className="mt-2 text-xs text-orange-700">
            Some older lines have no pricing snapshot — the cost and profit figures above exclude them.
          </p>
        )}
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';
import type { AdminPartsOrder } from '@/app/dashboard/parts-orders/_lib/partsAdmin';
import { BTN_INACTIVE, ORDER_STATUSES, ORDER_STATUS_BANNER } from '../_lib/partsOrderStyles';

/**
 * Where this order stands, and the only control that changes it.
 *
 * The colour accent does the attention-grabbing — an unpaid order must not be
 * missed — so the type itself stays quiet.
 */
export default function OrderStatusBanner({ order, status, busy, onStatusChange, onSave }: {
  order: AdminPartsOrder;
  /** The pending selection, which may differ from `order.status` until saved. */
  status: string;
  busy: boolean;
  onStatusChange: (status: string) => void;
  onSave: () => void;
}) {
  const tint = ORDER_STATUS_BANNER[order.status] ?? 'border-l-gray-400 bg-gray-50 text-gray-800';
  return (
    <div className={`mb-6 rounded-md border-l-4 px-4 py-3 ${tint}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xs font-medium uppercase tracking-widest opacity-70">Order status</span>
        <span className="text-xl font-semibold capitalize">{order.status.replace(/_/g, ' ')}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-white px-3 text-sm text-[var(--text-dark-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <Button onClick={onSave} disabled={busy} variant="outline" className={BTN_INACTIVE}>Save</Button>
      </div>
    </div>
  );
}

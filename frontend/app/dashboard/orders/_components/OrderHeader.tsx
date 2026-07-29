import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types/Order';

const STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'paid', label: 'Paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending Payment', className: 'border-amber-500 text-[var(--highlight)]' },
  paid: { label: 'Paid', className: 'border-green-600 text-highlight1' },
  completed: { label: 'Completed', className: 'text-[var(--text-dark-secondary)] border-gray-400' },
  cancelled: { label: 'Cancelled', className: 'border-red-500 text-destructive' },
  refunded: { label: 'Refunded', className: 'border-orange-500 text-orange-600' },
};

/** Reference, current status, and the status control. */
export default function OrderHeader({ order, selectedStatus, isSaving, onStatusChange, onUpdate }: {
  order: Order;
  /** Pending selection, which may differ from order.status until updated. */
  selectedStatus: string;
  isSaving: boolean;
  onStatusChange: (status: string) => void;
  onUpdate: () => void;
}) {
  const badge = STATUS_BADGE[order.status];
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-dark-primary)] font-mono mb-1">
          {order.order_reference}
        </h1>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant="outline" className={`text-sm px-3 py-1 ${badge.className}`}>{badge.label}</Badge>
          )}
          {order.order_kind === 'bike' && (
            <Badge variant="outline" className="text-sm px-3 py-1 border-[var(--highlight)] text-[var(--highlight)]">
              Deposit
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={selectedStatus}
          onChange={e => onStatusChange(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <Button onClick={onUpdate} disabled={isSaving || selectedStatus === order.status}>
          {isSaving ? 'Saving...' : 'Update Status'}
        </Button>
      </div>
    </div>
  );
}

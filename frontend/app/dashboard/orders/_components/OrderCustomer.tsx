import type { Order } from '@/types/Order';
import DetailRow from './DetailRow';

/** Who placed the order. */
export default function OrderCustomer({ order }: { order: Order }) {
  return (
    <div className="mb-6">
      <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">Customer</h2>
      <DetailRow label="Name" value={order.customer_name} />
      <DetailRow label="Email" value={order.customer_email} />
      {order.customer_phone && <DetailRow label="Phone" value={order.customer_phone} />}
    </div>
  );
}

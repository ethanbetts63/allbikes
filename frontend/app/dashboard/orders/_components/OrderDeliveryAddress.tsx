import type { Order } from '@/types/Order';
import DetailRow from '@/components/ui/detail-row';

/** Where a product order ships. Deposits have nothing to deliver. */
export default function OrderDeliveryAddress({ order }: { order: Order }) {
  if (order.payment_type === 'deposit') return null;

  const address = [
    order.address_line1,
    order.address_line2,
    `${order.suburb} ${order.state} ${order.postcode}`,
  ].filter(Boolean).join(', ');

  return (
    <div className="mb-6">
      <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">Delivery Address</h2>
      <DetailRow label="Address" value={address} />
    </div>
  );
}

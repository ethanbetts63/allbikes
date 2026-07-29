import { formatDate } from '@/utils/formatting';
import type { Order } from '@/types/Order';
import DetailRow from '@/components/ui/detail-row';

/**
 * What was bought. A deposit is against a motorcycle and shows the amount paid;
 * a full order is against a product and shows its price.
 */
export default function OrderDetails({ order }: { order: Order }) {
  const isDeposit = order.payment_type === 'deposit';
  const displayPrice = order.amount_paid ?? '0';

  return (
    <div className="mb-6">
      <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">
        {isDeposit ? 'Deposit Details' : 'Order Details'}
      </h2>
      {isDeposit ? (
        <>
          <DetailRow label="Motorcycle" value={order.motorcycle_name ?? '—'} />
          {order.selected_colour && <DetailRow label="Colour" value={order.selected_colour} />}
          <DetailRow label="Deposit Paid" value={`$${parseFloat(displayPrice).toLocaleString()}`} />
        </>
      ) : (
        <>
          <DetailRow label="Product" value={order.product_name ?? '—'} />
          <DetailRow label="Price" value={`$${parseFloat(displayPrice).toLocaleString()} incl. GST`} />
        </>
      )}
      <DetailRow label="Placed" value={formatDate(order.created_at)} />
      <DetailRow label="Last Updated" value={formatDate(order.updated_at)} />
    </div>
  );
}

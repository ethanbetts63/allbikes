import type { AdminPartsOrder } from '@/app/dashboard/parts-orders/_lib/partsAdmin';

/** Who the order is for and where it ships. */
export default function CustomerSummary({ order }: { order: AdminPartsOrder }) {
  const address = [
    order.address_line1,
    order.address_line2,
    `${order.suburb} ${order.state} ${order.postcode}`,
    order.country,
  ].filter(Boolean).join(', ');

  return (
    <div className="mb-6 grid gap-6 sm:grid-cols-2">
      <div>
        <h2 className="mb-2 font-bold">Customer</h2>
        <p className="text-sm">{order.customer_name}</p>
        <p className="text-sm text-[var(--text-dark-secondary)]">{order.customer_email}</p>
        {order.customer_phone && (
          <p className="text-sm text-[var(--text-dark-secondary)]">{order.customer_phone}</p>
        )}
      </div>
      <div>
        <h2 className="mb-2 font-bold">Ship to</h2>
        <p className="text-sm text-[var(--text-dark-secondary)]">{address}</p>
      </div>
    </div>
  );
}

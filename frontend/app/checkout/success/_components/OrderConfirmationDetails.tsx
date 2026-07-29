import type { Order } from '@/types/Order';

/** What was bought, where it ships, and how to reach the customer. */
export default function OrderConfirmationDetails({ order }: { order: Order }) {
  const isDeposit = order.order_kind === 'bike';
  const amountPaid = parseFloat(order.amount_paid ?? '0').toLocaleString();

  return (
    <div className="bg-[var(--bg-light-primary)] border border-border-light rounded-lg divide-y divide-stone-100 mb-8">
      {isDeposit ? (
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
            Motorcycle Reserved
          </p>
          <p className="font-bold text-[var(--text-dark-primary)]">{order.order_kind === 'bike' ? order.motorcycle_name : ''}</p>
          {order.selected_colour && (
            <p className="text-[var(--text-dark-secondary)] text-sm">Colour: {order.selected_colour}</p>
          )}
          <p className="text-[var(--text-dark-secondary)] text-sm">
            ${amountPaid} deposit paid — our team will be in touch as soon as possible to organise pickup.
          </p>
        </div>
      ) : (
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
            Product
          </p>
          <p className="font-bold text-[var(--text-dark-primary)]">{order.order_kind === 'product' ? order.product_name : ''}</p>
          <p className="text-[var(--text-dark-secondary)] text-sm">
            ${amountPaid} incl. GST &middot; Free delivery Australia-wide
          </p>
        </div>
      )}

      {!isDeposit && (
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
            Delivery Address
          </p>
          <p className="text-stone-700 text-sm">{order.customer_name}</p>
          <p className="text-stone-700 text-sm">{order.address_line1}</p>
          {order.address_line2 && <p className="text-stone-700 text-sm">{order.address_line2}</p>}
          <p className="text-stone-700 text-sm">{order.suburb} {order.state} {order.postcode}</p>
        </div>
      )}

      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
          Contact
        </p>
        <p className="text-stone-700 text-sm">{order.customer_email}</p>
        {order.customer_phone && <p className="text-stone-700 text-sm">{order.customer_phone}</p>}
      </div>
    </div>
  );
}

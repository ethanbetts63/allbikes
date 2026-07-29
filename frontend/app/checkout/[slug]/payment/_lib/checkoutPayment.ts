import type { CheckoutItemSummary } from '@/app/checkout/[slug]/_lib/CheckoutItemSummary';
import type { Order } from '@/types/Order';

/**
 * The order restated for the payment screen.
 *
 * No image: this screen loads from the order, which does not carry one, and a
 * placeholder would just be noise this late in the flow.
 */
export function buildSummaryFromOrder(order: Order): CheckoutItemSummary {
  const isDeposit = order.order_kind === 'bike';
  return {
    name: isDeposit
      ? order.motorcycle_name
      : order.product_name,
    imageUrl: null,
    priceLabel: isDeposit
      ? `${order.selected_colour ? `Colour: ${order.selected_colour} · ` : ''}Deposit reservation`
      : 'Secure online payment',
    isDeposit,
  };
}

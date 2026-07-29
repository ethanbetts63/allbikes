import type { CheckoutItemSummary } from '@/types/CheckoutItemSummary';
import type { Order } from '@/types/Order';

/**
 * The order restated for the payment screen.
 *
 * No image: this screen loads from the order, which does not carry one, and a
 * placeholder would just be noise this late in the flow.
 */
export function buildSummaryFromOrder(order: Order): CheckoutItemSummary {
  const isDeposit = order.payment_type === 'deposit';
  return {
    name: isDeposit
      ? order.motorcycle_name ?? 'Motorcycle deposit'
      : order.product_name ?? 'E-scooter order',
    imageUrl: null,
    priceLabel: isDeposit
      ? `${order.selected_colour ? `Colour: ${order.selected_colour} · ` : ''}Deposit reservation`
      : 'Secure online payment',
    isDeposit,
  };
}

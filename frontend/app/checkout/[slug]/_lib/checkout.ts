import type { Bike } from '@/types/Bike';
import type { CheckoutItemSummary } from '@/types/CheckoutItemSummary';
import type { Product } from '@/types/Product';
import { getPrimaryVehicleImage } from '@/utils/vehicleImages';

export type CheckoutType = 'product' | 'deposit';

const EMPTY_SUMMARY: CheckoutItemSummary = {
  name: '', imageUrl: null, priceLabel: '', isDeposit: false,
};

/**
 * What the customer sees they are buying — either a deposit against a bike or
 * a product at its discounted price.
 */
export const buildItemSummary = ({ checkoutType, bike, product, depositAmount }: {
  checkoutType: CheckoutType;
  bike: Bike | null;
  product: Product | null;
  depositAmount: string | null;
}): CheckoutItemSummary => {
  if (checkoutType === 'deposit' && bike && depositAmount) {
    return {
      name: bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`,
      imageUrl: getPrimaryVehicleImage(bike.images, 'thumbnail'),
      priceLabel: `$${parseFloat(depositAmount).toLocaleString()} deposit`,
      isDeposit: true,
    };
  }
  if (product) {
    const price = product.discount_price && parseFloat(product.discount_price) > 0
      ? product.discount_price
      : product.price;
    return {
      name: product.name,
      imageUrl: getPrimaryVehicleImage(product.images, 'thumbnail'),
      priceLabel: `$${parseFloat(price).toLocaleString()} incl. GST · Free delivery Australia-wide`,
      isDeposit: false,
    };
  }
  return EMPTY_SUMMARY;
};

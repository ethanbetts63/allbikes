import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types/Product';

/** Stock level as a badge: out of stock, low, or a plain count. */
export default function ProductStockBadge({ product }: { product: Product }) {
  if (!product.in_stock) return <Badge variant="destructive">Out of Stock</Badge>;
  if (product.low_stock) {
    return (
      <Badge variant="outline" className="border-orange-500 text-orange-600">
        {product.stock_quantity} — Low
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-green-600 text-highlight1">
      {product.stock_quantity} in stock
    </Badge>
  );
}

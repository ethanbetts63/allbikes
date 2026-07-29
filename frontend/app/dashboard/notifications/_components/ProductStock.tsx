import Link from 'next/link';

import type { NotificationProduct } from '@/types/AdminNotifications';
import NotificationSection from './NotificationSection';
import { LIST_PANEL } from '../_lib/notificationStyles';

/** Active products that are out of stock or under the low-stock threshold. */
export default function ProductStock({ products }: { products: NotificationProduct[] }) {
  return (
    <NotificationSection title="Product stock" count={products.length}>
      <div className={LIST_PANEL}>
        {products.map(product => (
          <Link
            key={product.id}
            href="/dashboard/products"
            className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-light-secondary)] transition-colors"
          >
            <span className="text-sm text-[var(--text-dark-primary)] font-medium">{product.name}</span>
            {!product.in_stock ? (
              <span className="text-xs text-destructive font-bold uppercase tracking-widest">Out of Stock</span>
            ) : (
              <span className="text-xs text-[var(--highlight)] font-bold uppercase tracking-widest">
                Low Stock — {product.stock_quantity} left
              </span>
            )}
          </Link>
        ))}
      </div>
    </NotificationSection>
  );
}

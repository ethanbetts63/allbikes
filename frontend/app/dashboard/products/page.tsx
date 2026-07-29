'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PlusSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { adminGetProducts, deleteProduct } from '@/api';
import type { Product } from '@/types/Product';
import ProductsTable from './_components/ProductsTable';

export default function AdminProductDashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Bumped after a delete to re-run the load. Fetching inside the effect (rather
  // than through a callback the effect invokes) keeps every setState inside a
  // promise callback, which is what react-hooks/set-state-in-effect wants.
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminGetProducts()
      .then((response) => { if (!cancelled) setProducts(response.results); })
      .catch(() => {
        if (!cancelled) setNotification({ message: 'Failed to load products.', type: 'error' });
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [reloadToken]);

  const handleEdit = useCallback(
    (product: Product) => router.push(`/dashboard/products/${product.id}/edit`),
    [router],
  );

  const handleDelete = useCallback(async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      setNotification({ message: `"${product.name}" deleted successfully.`, type: 'success' });
      setReloadToken((t) => t + 1);
    } catch {
      setNotification({ message: 'Failed to delete product.', type: 'error' });
    }
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-dark-primary)]">E-Scooter Products</h1>
        <Button onClick={() => router.push('/dashboard/products/new')}>
          <PlusSquare className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="w-full bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] p-4 rounded-lg">
        {isLoading ? (
          <p className="text-center text-[var(--text-dark-secondary)] py-8">Loading products...</p>
        ) : (
          <ProductsTable products={products} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}

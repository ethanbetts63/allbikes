import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetProducts, deleteProduct } from '@/api';
import type { Product } from '@/types/Product';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlusSquare, Pencil, Trash2 } from 'lucide-react';

const AdminProductDashboardPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await adminGetProducts();
      setProducts(data.results);
    } catch {
      setError('Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(product.id);
      setNotification(`"${product.name}" deleted.`);
      fetchProducts();
    } catch {
      setError('Failed to delete product.');
    }
  };

  const stockBadge = (product: Product) => {
    if (!product.in_stock) return <Badge variant="destructive">Out of Stock</Badge>;
    if (product.low_stock) return <Badge variant="outline" className="border-orange-500 text-orange-600">Low Stock ({product.stock_quantity})</Badge>;
    return <Badge variant="outline" className="border-green-500 text-green-600">{product.stock_quantity} in stock</Badge>;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Product Management</h1>
        <Button onClick={() => navigate('/dashboard/products/new')}>
          <PlusSquare className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {notification && (
        <Alert className="mb-4">
          <AlertDescription>{notification}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground">No products found. Add your first product.</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Brand</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t hover:bg-muted/50">
                  <td className="p-3 font-medium">{product.name}</td>
                  <td className="p-3 text-muted-foreground">{product.brand || '—'}</td>
                  <td className="p-3">${parseFloat(product.price).toFixed(2)}</td>
                  <td className="p-3">{stockBadge(product)}</td>
                  <td className="p-3">
                    {product.is_active ? (
                      <Badge variant="outline" className="border-green-500 text-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                    )}
                  </td>
                  <td className="p-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/products/${product.id}/edit`)}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminProductDashboardPage;

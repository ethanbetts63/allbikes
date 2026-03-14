import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Trash2, PlusSquare } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { adminGetProducts, deleteProduct } from '@/api';
import type { Product } from '@/types/Product';

const AdminProductDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Product[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchProducts = async () => {
    try {
      const response = await adminGetProducts();
      setData(response.results);
    } catch {
      setNotification({ message: 'Failed to load products.', type: 'error' });
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
      setNotification({ message: `"${product.name}" deleted successfully.`, type: 'success' });
      fetchProducts();
    } catch {
      setNotification({ message: 'Failed to delete product.', type: 'error' });
    }
  };

  const columns: ColumnDef<Product>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="text-[var(--text-dark-primary)]"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium text-[var(--text-dark-primary)]">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'brand',
      header: () => <div className="text-[var(--text-dark-primary)]">Brand</div>,
      cell: ({ row }) => <div className="text-[var(--text-dark-primary)]">{row.getValue('brand') || '—'}</div>,
    },
    {
      accessorKey: 'price',
      header: () => <div className="text-right text-[var(--text-dark-primary)]">Price</div>,
      cell: ({ row }) => {
        const formatted = new Intl.NumberFormat('en-AU', {
          style: 'currency',
          currency: 'AUD',
        }).format(parseFloat(row.getValue('price')));
        return <div className="text-right text-[var(--text-dark-primary)]">{formatted} <span className="text-xs text-[var(--text-dark-secondary)]">incl. GST</span></div>;
      },
    },
    {
      accessorKey: 'stock_quantity',
      header: () => <div className="text-[var(--text-dark-primary)]">Stock</div>,
      cell: ({ row }) => {
        const product = row.original;
        if (!product.in_stock) {
          return <Badge variant="destructive">Out of Stock</Badge>;
        }
        if (product.low_stock) {
          return <Badge variant="outline" className="border-orange-500 text-orange-600">{product.stock_quantity} — Low</Badge>;
        }
        return <Badge variant="outline" className="border-green-600 text-highlight1">{product.stock_quantity} in stock</Badge>;
      },
    },
    {
      accessorKey: 'is_active',
      header: () => <div className="text-[var(--text-dark-primary)]">Status</div>,
      cell: ({ row }) =>
        row.getValue('is_active') ? (
          <Badge variant="outline" className="border-green-600 text-highlight1">Active</Badge>
        ) : (
          <Badge variant="outline" className="text-[var(--text-dark-secondary)] border-gray-400">Inactive</Badge>
        ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/dashboard/products/${row.original.id}/edit`)}
            className="text-[var(--text-dark-primary)]"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-light-primary)]">E-Scooter Products</h1>
        <Button onClick={() => navigate('/dashboard/products/new')}>
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
          <>
            <div className="rounded-md border border-gray-300">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-gray-300">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-[var(--text-dark-primary)]">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="border-gray-300">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="text-[var(--text-dark-primary)]">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center text-[var(--text-dark-primary)]">
                        No products found. Add your first product.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="text-sm text-[var(--text-dark-secondary)] mt-3">
              {data.length} product{data.length !== 1 ? 's' : ''} total
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminProductDashboardPage;

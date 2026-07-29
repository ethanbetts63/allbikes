import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types/Product';
import ProductStockBadge from './ProductStockBadge';

const currency = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' });

/**
 * Sortable product list. Owns its own sort state — nothing above it needs to
 * know how the table is ordered.
 */
export default function ProductsTable({ products, onEdit, onDelete }: {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);

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
      cell: ({ row }) => (
        <div className="font-medium text-[var(--text-dark-primary)]">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'brand',
      header: () => <div className="text-[var(--text-dark-primary)]">Brand</div>,
      cell: ({ row }) => (
        <div className="text-[var(--text-dark-primary)]">{row.getValue('brand') || '—'}</div>
      ),
    },
    {
      accessorKey: 'price',
      header: () => <div className="text-right text-[var(--text-dark-primary)]">Price</div>,
      cell: ({ row }) => (
        <div className="text-right text-[var(--text-dark-primary)]">
          {currency.format(parseFloat(row.getValue('price')))}{' '}
          <span className="text-xs text-[var(--text-dark-secondary)]">incl. GST</span>
        </div>
      ),
    },
    {
      accessorKey: 'stock_quantity',
      header: () => <div className="text-[var(--text-dark-primary)]">Stock</div>,
      cell: ({ row }) => <ProductStockBadge product={row.original} />,
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
            onClick={() => onEdit(row.original)}
            className="text-[var(--text-dark-primary)]"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [onEdit, onDelete]);

  const table = useReactTable({
    data: products,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  return (
    <>
      <div className="rounded-md border border-border-light overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border-light">
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
                <TableRow key={row.id} className="border-border-light">
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
        {products.length} product{products.length !== 1 ? 's' : ''} total
      </div>
    </>
  );
}

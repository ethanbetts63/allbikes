"use client"

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
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
import { adminGetOrders } from '@/api';
import type { Order } from '@/types/Order';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending_payment: { label: 'Pending Payment', className: 'border-amber-500 text-[var(--highlight)]' },
  paid:            { label: 'Paid',            className: 'border-green-600 text-highlight1' },
  dispatched:      { label: 'Dispatched',      className: 'border-blue-500 text-blue-600' },
  delivered:       { label: 'Delivered',       className: 'text-[var(--text-dark-secondary)] border-gray-400' },
  cancelled:       { label: 'Cancelled',       className: 'border-red-500 text-destructive' },
  refunded:        { label: 'Refunded',        className: 'border-orange-500 text-orange-600' },
};

type FilterType = 'all' | 'todo';

const OrderTable = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Order[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState<FilterType>('todo');
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const PAGE_SIZE = 50;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const statusParam = filter === 'todo' ? 'paid,dispatched' : undefined;
        const result = await adminGetOrders(statusParam, page);
        setData(result.results);
        setCount(result.count);
        setHasNext(result.next !== null);
        setHasPrev(result.previous !== null);
      } catch {
        setNotification({ message: 'Failed to fetch orders.', type: 'error' });
      }
    };
    fetchOrders();
  }, [filter, page]);

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
  };

  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      accessorKey: 'order_reference',
      header: () => <div className="text-[var(--text-dark-primary)]">Reference</div>,
      cell: ({ row }) => <div className="font-mono font-semibold text-[var(--text-dark-primary)]">{row.getValue('order_reference')}</div>,
    },
    {
      accessorKey: 'product_name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-[var(--text-dark-primary)]">
          Product <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-[var(--text-dark-primary)]">{row.getValue('product_name')}</div>,
    },
    {
      accessorKey: 'customer_name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-[var(--text-dark-primary)]">
          Customer <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="text-[var(--text-dark-primary)] font-medium">{row.getValue('customer_name')}</div>
          <div className="text-[var(--text-dark-secondary)] text-xs">{row.original.customer_email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-[var(--text-dark-primary)]">Status</div>,
      cell: ({ row }) => {
        const s = STATUS_BADGE[row.getValue('status') as string];
        return s
          ? <Badge variant="outline" className={s.className}>{s.label}</Badge>
          : <Badge variant="outline" className="text-[var(--text-dark-primary)] border-black">{row.getValue('status')}</Badge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-[var(--text-dark-primary)]">
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-[var(--text-dark-primary)] text-sm">
          {new Date(row.getValue('created_at')).toLocaleDateString('en-AU')}
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

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="w-full bg-white text-[var(--text-dark-primary)] p-4 rounded-lg">
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center space-x-2 py-4">
        <Button
          variant="outline"
          onClick={() => handleFilterChange('todo')}
          className={filter === 'todo' ? 'bg-white text-[var(--text-dark-primary)] border-black' : 'bg-gray-200 text-[var(--text-dark-primary)] border-black hover:bg-gray-300'}
        >
          To Do
        </Button>
        <Button
          variant="outline"
          onClick={() => handleFilterChange('all')}
          className={filter === 'all' ? 'bg-white text-[var(--text-dark-primary)] border-black' : 'bg-gray-200 text-[var(--text-dark-primary)] border-black hover:bg-gray-300'}
        >
          All Orders
        </Button>
      </div>

      <div className="rounded-md border border-gray-300">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="border-gray-300">
                {hg.headers.map(h => (
                  <TableHead key={h.id} className="text-[var(--text-dark-primary)]">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  className="border-gray-300 cursor-pointer hover:bg-stone-50"
                  onClick={() => navigate(`/dashboard/orders/${row.original.id}`)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="text-[var(--text-dark-primary)]">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-[var(--text-dark-primary)]">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-sm text-[var(--text-dark-secondary)]">
          {count} order{count !== 1 ? 's' : ''}{totalPages > 1 && ` · page ${page} of ${totalPages}`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p - 1)}
              disabled={!hasPrev}
              className="text-[var(--text-dark-primary)] border-gray-300"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasNext}
              className="text-[var(--text-dark-primary)] border-gray-300"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTable;

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
  pending_payment: { label: 'Pending Payment', className: 'border-amber-500 text-amber-600' },
  paid:            { label: 'Paid',            className: 'border-green-600 text-green-700' },
  dispatched:      { label: 'Dispatched',      className: 'border-blue-500 text-blue-600' },
  delivered:       { label: 'Delivered',       className: 'text-gray-500 border-gray-400' },
  cancelled:       { label: 'Cancelled',       className: 'border-red-500 text-red-600' },
  refunded:        { label: 'Refunded',        className: 'border-orange-500 text-orange-600' },
};

const OrderTable = ({ orders, isLoading }: { orders: Order[]; isLoading: boolean }) => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns: ColumnDef<Order>[] = useMemo(() => [
    {
      accessorKey: 'order_reference',
      header: () => <div className="text-black font-semibold">Reference</div>,
      cell: ({ row }) => <div className="font-mono font-semibold text-black">{row.getValue('order_reference')}</div>,
    },
    {
      accessorKey: 'product_name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-black">
          Product <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-black">{row.getValue('product_name')}</div>,
    },
    {
      accessorKey: 'customer_name',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-black">
          Customer <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="text-black font-medium">{row.getValue('customer_name')}</div>
          <div className="text-gray-500 text-xs">{row.original.customer_email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-black">Status</div>,
      cell: ({ row }) => {
        const s = STATUS_BADGE[row.getValue('status') as string];
        return s
          ? <Badge variant="outline" className={s.className}>{s.label}</Badge>
          : <Badge variant="outline">{row.getValue('status')}</Badge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-black">
          Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-black text-sm">
          {new Date(row.getValue('created_at')).toLocaleDateString('en-AU')}
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  if (isLoading) {
    return <p className="text-center text-gray-500 py-8">Loading orders...</p>;
  }

  return (
    <div className="rounded-md border border-gray-300">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(hg => (
            <TableRow key={hg.id} className="border-gray-300">
              {hg.headers.map(h => (
                <TableHead key={h.id} className="text-black">
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
                  <TableCell key={cell.id} className="text-black">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-black">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

const AdminOrderDashboardPage = () => {
  const [tab, setTab] = useState<'todo' | 'all'>('todo');
  const [todoOrders, setTodoOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoadingTodo, setIsLoadingTodo] = useState(true);
  const [isLoadingAll, setIsLoadingAll] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodo = async () => {
      try {
        const data = await adminGetOrders('paid,dispatched');
        setTodoOrders(data);
      } catch {
        setError('Failed to load orders.');
      } finally {
        setIsLoadingTodo(false);
      }
    };
    const fetchAll = async () => {
      try {
        const data = await adminGetOrders();
        setAllOrders(data);
      } catch {
        setError('Failed to load orders.');
      } finally {
        setIsLoadingAll(false);
      }
    };
    fetchTodo();
    fetchAll();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Orders</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab('todo')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${tab === 'todo' ? 'border-b-2 border-stone-900 text-stone-900' : 'text-gray-500 hover:text-stone-700'}`}
        >
          To Do
          {!isLoadingTodo && (
            <span className="ml-2 bg-amber-400 text-stone-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {todoOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-semibold transition-colors ${tab === 'all' ? 'border-b-2 border-stone-900 text-stone-900' : 'text-gray-500 hover:text-stone-700'}`}
        >
          All Orders
        </button>
      </div>

      <div className="w-full bg-white text-black p-4 rounded-lg">
        {tab === 'todo' ? (
          <>
            <OrderTable orders={todoOrders} isLoading={isLoadingTodo} />
            {!isLoadingTodo && (
              <p className="text-sm text-gray-500 mt-3">{todoOrders.length} order{todoOrders.length !== 1 ? 's' : ''} requiring action</p>
            )}
          </>
        ) : (
          <>
            <OrderTable orders={allOrders} isLoading={isLoadingAll} />
            {!isLoadingAll && (
              <p className="text-sm text-gray-500 mt-3">{allOrders.length} order{allOrders.length !== 1 ? 's' : ''} total</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrderDashboardPage;

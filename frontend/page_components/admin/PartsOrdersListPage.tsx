'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/utils/formatting';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { adminGetPartsOrders } from '@/services/partsAdminService';
import type { AdminPartsOrderListItem } from '@/types/partsAdmin';

export const PARTS_STATUS_BADGE: Record<string, string> = {
  pending_payment: 'border-amber-500 text-[var(--highlight)]',
  paid: 'border-green-600 text-green-700',
  dispatched: 'border-blue-500 text-blue-700',
  cancelled: 'border-red-500 text-destructive',
  refunded: 'border-orange-500 text-orange-600',
  partially_refunded: 'border-orange-400 text-orange-500',
};

const STATUS_FILTERS = [
  { key: 'paid,dispatched', label: 'To Do' },
  { key: '', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'dispatched', label: 'Dispatched' },
];

export default function PartsOrdersListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminPartsOrderListItem[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [status, setStatus] = useState('paid,dispatched');
  const [backorderOnly, setBackorderOnly] = useState(false);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminGetPartsOrders({ status: status || undefined, has_backorder: backorderOnly, q: search || undefined, page })
      .then((res) => {
        setOrders(res.results);
        setCount(res.count);
        setHasNext(res.next !== null);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [status, backorderOnly, search, page]);

  const applyFilter = (key: string) => { setStatus(key); setPage(1); };
  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(q.trim()); setPage(1); };

  return (
    <div className="p-4 md:p-6">
      <h1 className="mb-4 text-2xl font-bold text-[var(--text-dark-primary)]">Parts Orders</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.label}
            variant="outline"
            onClick={() => applyFilter(f.key)}
            className={status === f.key ? 'border-black' : 'bg-gray-200 border-black hover:bg-gray-300'}
          >
            {f.label}
          </Button>
        ))}
        <Button
          variant="outline"
          onClick={() => { setBackorderOnly((b) => !b); setPage(1); }}
          className={backorderOnly ? 'border-black' : 'bg-gray-200 border-black hover:bg-gray-300'}
        >
          Backorders only
        </Button>
        <form onSubmit={submitSearch} className="ml-auto flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ref / email / name"
            className="h-9 w-64 rounded-md border border-input bg-transparent px-3 text-sm text-[var(--text-dark-primary)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button type="submit" variant="outline" className="border-black">Search</Button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-md border border-border-light bg-[var(--bg-light-primary)]">
        <Table>
          <TableHeader>
            <TableRow className="border-border-light">
              <TableHead className="text-[var(--text-dark-primary)]">Reference</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Customer</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Items</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Total</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Status</TableHead>
              <TableHead className="text-[var(--text-dark-primary)]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center"><Spinner className="mx-auto h-6 w-6" /></TableCell></TableRow>
            ) : orders.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-24 text-center text-[var(--text-dark-primary)]">No orders found.</TableCell></TableRow>
            ) : (
              orders.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer border-border-light hover:bg-[var(--bg-light-secondary)]"
                  onClick={() => router.push(`/dashboard/parts-orders/${o.id}`)}
                >
                  <TableCell>
                    <div className="font-mono font-semibold text-[var(--text-dark-primary)]">{o.order_reference}</div>
                    {o.has_backorder && (
                      <div className="mt-0.5 text-xs font-bold uppercase tracking-wider text-orange-600">Backorder</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-[var(--text-dark-primary)]">{o.customer_name}</div>
                    <div className="text-xs text-[var(--text-dark-secondary)]">{o.customer_email}</div>
                  </TableCell>
                  <TableCell className="text-[var(--text-dark-primary)]">{o.item_count}</TableCell>
                  <TableCell className="text-[var(--text-dark-primary)]">${o.total}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PARTS_STATUS_BADGE[o.status] ?? 'border-gray-400 text-[var(--text-dark-primary)]'}>
                      {o.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--text-dark-primary)]">{formatDate(o.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-[var(--text-dark-secondary)]">{count} order{count !== 1 ? 's' : ''}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border-border-light">Previous</Button>
          <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)} className="border-border-light">Next</Button>
        </div>
      </div>
    </div>
  );
}

import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { formatDate } from '@/lib/formatting';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import type { AdminPartsOrderListItem } from '@/app/dashboard/parts-orders/_lib/partsAdmin';
import {
  ORDER_STATUS_STYLE, type Sort, type SortField, humanizeStatus,
} from '../_lib/partsOrderStyles';

/** Orders list, tinted by status, with sortable columns. */
export default function PartsOrdersTable({
  orders, loading, sort, activeFilters, onSort, onClearFilters,
}: {
  orders: AdminPartsOrderListItem[];
  loading: boolean;
  /** null means the backend's "to-do first" default ordering. */
  sort: Sort | null;
  activeFilters: number;
  onSort: (field: SortField) => void;
  onClearFilters: () => void;
}) {
  const router = useRouter();
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader className="bg-slate-50">
          <TableRow className="border-slate-200 hover:bg-slate-50">
            <TableHead className="font-semibold text-slate-600">Reference</TableHead>
            <SortHeader field="customer_name" sort={sort} onSort={onSort}>Customer</SortHeader>
            <TableHead className="font-semibold text-slate-600">Items</TableHead>
            <SortHeader field="total" align="right" sort={sort} onSort={onSort}>Total</SortHeader>
            <SortHeader field="status" sort={sort} onSort={onSort}>Status</SortHeader>
            <SortHeader field="created_at" sort={sort} onSort={onSort}>Date</SortHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-48 text-center">
                <Spinner className="mx-auto h-6 w-6" />
              </TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-48 text-center text-slate-500">
                <Search className="mx-auto mb-3 h-5 w-5 text-slate-400" />
                <p className="font-medium text-slate-700">No orders match these filters.</p>
                {activeFilters > 0 && (
                  <Button variant="link" size="sm" onClick={onClearFilters}>Clear filters</Button>
                )}
              </TableCell>
            </TableRow>
          ) : (
            orders.map((o) => {
              const st = ORDER_STATUS_STYLE[o.status] ?? { row: 'hover:bg-slate-50', swatch: '', label: o.status };
              return (
                <TableRow
                  key={o.id}
                  className={`cursor-pointer border-slate-100 ${st.row}`}
                  onClick={() => router.push(`/dashboard/parts-orders/${o.order_reference}`)}
                >
                  <TableCell>
                    <div className="font-mono font-semibold text-slate-950">{o.order_reference}</div>
                    {o.has_backorder && (
                      <div className="mt-0.5 text-xs font-bold uppercase tracking-wider text-orange-600">
                        Backorder
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{o.customer_name}</div>
                    <div className="text-xs text-slate-500">{o.customer_email}</div>
                  </TableCell>
                  <TableCell className="text-slate-700">{o.item_count}</TableCell>
                  <TableCell className="text-right font-semibold text-slate-950">${o.total}</TableCell>
                  <TableCell className="text-sm font-medium text-slate-700">{humanizeStatus(o.status)}</TableCell>
                  <TableCell className="text-sm text-slate-600">{formatDate(o.created_at)}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SortHeader({ field, children, align = 'left', sort, onSort }: {
  field: SortField;
  children: React.ReactNode;
  align?: 'left' | 'right';
  sort: Sort | null;
  onSort: (field: SortField) => void;
}) {
  const active = sort?.field === field;
  return (
    <TableHead className={align === 'right' ? 'text-right' : ''}>
      <button
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-950 ${align === 'right' ? 'justify-end' : ''}`}
      >
        {children}
        {active && sort ? (
          sort.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>
    </TableHead>
  );
}

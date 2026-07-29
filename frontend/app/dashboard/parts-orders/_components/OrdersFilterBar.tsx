import { Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ORDER_FILTER_OPTIONS, ORDER_LEGEND_ORDER, ORDER_STATUS_STYLE } from '../_lib/partsOrderStyles';

/** Status/backorder/search filters, the result count, and the row colour key. */
export default function OrdersFilterBar({
  count, status, backorderOnly, query, activeFilters,
  onStatusChange, onBackorderChange, onQueryChange, onSubmitSearch, onClearFilters,
}: {
  count: number;
  status: string;
  backorderOnly: boolean;
  /** The uncommitted search box value; searching happens on submit. */
  query: string;
  activeFilters: number;
  onStatusChange: (status: string) => void;
  onBackorderChange: (backorderOnly: boolean) => void;
  onQueryChange: (query: string) => void;
  onSubmitSearch: (e: React.FormEvent) => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <SlidersHorizontal className="h-4 w-4" /> Order filters
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {count.toLocaleString('en-AU')} {count === 1 ? 'order' : 'orders'} matching this view
          </p>
        </div>
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="self-start text-slate-600">
            <X className="mr-1 h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ORDER_FILTER_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={backorderOnly ? 'backorder' : 'all'}
          onValueChange={(v) => onBackorderChange(v === 'backorder')}
        >
          <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All orders</SelectItem>
            <SelectItem value="backorder">Backorders only</SelectItem>
          </SelectContent>
        </Select>

        <form className="sm:col-span-2 lg:col-span-1" onSubmit={onSubmitSearch}>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search ref, email or name"
              aria-label="Search orders"
              className="bg-white"
            />
            <Button
              type="submit"
              variant="outline"
              className="shrink-0 border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
            >
              <Search className="mr-1.5 h-4 w-4" /> Search
            </Button>
          </div>
        </form>
      </div>

      {/* Colour key */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="font-medium text-slate-600">Row colour:</span>
        {ORDER_LEGEND_ORDER.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm ${ORDER_STATUS_STYLE[s].swatch}`} />
            {ORDER_STATUS_STYLE[s].label}
          </span>
        ))}
      </div>
    </div>
  );
}

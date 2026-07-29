import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PAGE_SIZE } from '../_lib/partsOrderStyles';

const NAV = 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 '
  + 'disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400';

/** Range summary plus prev/next for the orders list. */
export default function OrdersPagination({ page, count, hasNext, loading, onPageChange }: {
  page: number;
  count: number;
  hasNext: boolean;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  return (
    <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-sm text-slate-500">
        {count ? (page - 1) * PAGE_SIZE + 1 : 0}–{Math.min(page * PAGE_SIZE, count)} of {count.toLocaleString('en-AU')}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className={NAV}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <span className="min-w-20 text-center text-sm text-slate-600">Page {page} of {pageCount}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext || loading}
          onClick={() => onPageChange(page + 1)}
          className={NAV}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </footer>
  );
}

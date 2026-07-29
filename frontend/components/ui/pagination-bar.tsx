import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

const NAV = 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 '
  + 'disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400';

/**
 * Count summary plus prev/next, shared by the admin list pages.
 *
 * Pass `summary` to describe the count however the page words it; without it
 * the bar just shows the total.
 */
export default function PaginationBar({
  summary, hasPrevious, hasNext, disabled = false, showChevrons = false, onPrevious, onNext,
}: {
  summary: React.ReactNode;
  hasPrevious: boolean;
  hasNext: boolean;
  /** Also disables both buttons while a fetch is in flight. */
  disabled?: boolean;
  showChevrons?: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 mt-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--text-dark-secondary)]">{summary}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevious || disabled}
          onClick={onPrevious}
          className={NAV}
        >
          {showChevrons && <ChevronLeft className="mr-1 h-4 w-4" />}
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext || disabled}
          onClick={onNext}
          className={NAV}
        >
          Next
          {showChevrons && <ChevronRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

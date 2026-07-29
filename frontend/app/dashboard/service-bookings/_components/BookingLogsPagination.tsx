import { Button } from '@/components/ui/button';

const NAV = 'text-[var(--text-dark-primary)] border-border-light';

/** Total count plus prev/next for the booking log list. */
export default function BookingLogsPagination({ totalCount, hasPrev, hasNext, onPrevious, onNext }: {
  totalCount: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-3">
      <span className="text-sm text-[var(--text-dark-secondary)]">
        {totalCount} booking{totalCount !== 1 ? 's' : ''} total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrev} className={NAV}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext} className={NAV}>
          Next
        </Button>
      </div>
    </div>
  );
}

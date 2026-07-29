import { Button } from '@/components/ui/button';

/** Total count plus prev/next for the sent message log. */
export default function MessagesPagination({ totalCount, hasPrev, hasNext, onPrevious, onNext }: {
  totalCount: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between mt-3">
      <span className="text-sm text-[var(--text-dark-secondary)]">
        {totalCount} message{totalCount !== 1 ? 's' : ''} total
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrev}>Previous</Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext}>Next</Button>
      </div>
    </div>
  );
}

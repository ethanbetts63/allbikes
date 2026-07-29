/** Prev/next for the bookings list. Hidden until there is more than one page. */
export default function HirePagination({ count, hasPrevious, hasNext, onPrevious, onNext }: {
  count: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (count <= 50) return null;
  return (
    <div className="flex justify-between items-center mt-4 text-sm text-[var(--text-dark-secondary)]">
      <button disabled={!hasPrevious} onClick={onPrevious} className="disabled:opacity-40">
        ← Previous
      </button>
      <span>{count} total</span>
      <button disabled={!hasNext} onClick={onNext} className="disabled:opacity-40">
        Next →
      </button>
    </div>
  );
}

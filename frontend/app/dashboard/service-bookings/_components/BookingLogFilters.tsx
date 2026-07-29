import { Button } from '@/components/ui/button';
import type { BookingLogFilter } from '../_lib/bookingLogStatus';

const ACTIVE = 'bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] border-black';
const INACTIVE = 'bg-gray-200 text-[var(--text-dark-primary)] border-black hover:bg-gray-300';

/** All vs failed-only. Failed is the one worth checking daily. */
export default function BookingLogFilters({ filter, onChange }: {
  filter: BookingLogFilter;
  onChange: (filter: BookingLogFilter) => void;
}) {
  return (
    <div className="flex items-center space-x-2 py-4">
      <Button variant="outline" onClick={() => onChange('all')} className={filter === 'all' ? ACTIVE : INACTIVE}>
        All
      </Button>
      <Button variant="outline" onClick={() => onChange('failed')} className={filter === 'failed' ? ACTIVE : INACTIVE}>
        Failed
      </Button>
    </div>
  );
}

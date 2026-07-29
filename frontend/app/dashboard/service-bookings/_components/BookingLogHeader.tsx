import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/utils/formatting';
import type { BookingRequestLog } from '@/types/BookingRequestLog';
import { statusBadgeClass } from '../_lib/bookingLogStatus';

/** Customer, outcome, when it was submitted, and the delete action. */
export default function BookingLogHeader({ log, onDelete }: {
  log: BookingRequestLog;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-dark-primary)] mb-1">{log.customer_name}</h1>
        <Badge variant="outline" className={statusBadgeClass(log.status)}>{log.status}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--text-dark-secondary)]">{formatDateTime(log.created_at)}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </div>
    </div>
  );
}

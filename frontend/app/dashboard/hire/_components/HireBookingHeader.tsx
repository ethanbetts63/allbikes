import { Download } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { HireBooking } from '@/types/HireBooking';
import { STATUS_BADGE, STATUS_OPTIONS } from '../_lib/hireStatus';

/** Reference, current status, and every action available on the booking. */
export default function HireBookingHeader({
  booking, selectedStatus, isSaving, isDeleting, isDownloading,
  onStatusChange, onUpdate, onDownloadContract, onDelete,
}: {
  booking: HireBooking;
  /** Pending selection, which may differ from booking.status until updated. */
  selectedStatus: string;
  isSaving: boolean;
  isDeleting: boolean;
  isDownloading: boolean;
  onStatusChange: (status: string) => void;
  onUpdate: () => void;
  onDownloadContract: () => void;
  onDelete: () => void;
}) {
  const badge = STATUS_BADGE[booking.status];
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
      <div>
        <h1 className="text-2xl font-bold font-mono mb-1">{booking.booking_reference}</h1>
        {badge && (
          <Badge variant="outline" className={`text-sm px-3 py-1 ${badge.className}`}>{badge.label}</Badge>
        )}
      </div>
      <div className="flex items-center gap-3">
        <select
          value={selectedStatus}
          onChange={e => onStatusChange(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <Button onClick={onUpdate} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Update'}
        </Button>
        <Button onClick={onDownloadContract} disabled={isDownloading} aria-label="Download contract">
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>
    </div>
  );
}

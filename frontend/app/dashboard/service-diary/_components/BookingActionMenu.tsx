import { Pencil, Trash2 } from 'lucide-react';

import type { Booking, BookingStatus } from '@/types/Booking';
import { BOOKING_STATUSES } from '@/app/dashboard/service-diary/_lib/bookingStatus';

/**
 * Quick actions for a job tile. Rendered fixed-position at the click point so
 * it escapes the scrolling day column.
 */
export default function BookingActionMenu({
  booking, x, y, menuRef, onEdit, onSetStatus, onDelete,
}: {
  booking: Booking;
  x: number;
  y: number;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onEdit: () => void;
  onSetStatus: (status: BookingStatus) => void;
  onDelete: () => void;
}) {
  const itemClass =
    'w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2';
  return (
    <div
      ref={menuRef}
      role="menu"
      style={{ left: x, top: y }}
      className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-56"
    >
      <button role="menuitem" onClick={onEdit} className={`${itemClass} font-medium`}>
        <Pencil className="h-4 w-4" /> Edit
      </button>

      <div className="my-1 border-t border-gray-100" />

      {BOOKING_STATUSES.map(s => {
        const current = s.value === booking.status;
        return (
          <button
            key={s.value}
            role="menuitem"
            disabled={current}
            onClick={() => onSetStatus(s.value)}
            className={`${itemClass} ${current ? 'opacity-50 cursor-default hover:bg-transparent' : ''}`}
          >
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${s.dot}`} />
            Make {s.label.toLowerCase()}
            {current && <span className="ml-auto text-xs text-gray-400">current</span>}
          </button>
        );
      })}

      <div className="my-1 border-t border-gray-100" />

      <button
        role="menuitem"
        onClick={onDelete}
        className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-red-50 flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" /> Delete
      </button>
    </div>
  );
}

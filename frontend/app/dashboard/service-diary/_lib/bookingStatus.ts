import type { BookingStatus } from '@/types/Booking';

// Single source of truth for diary job statuses — order, labels and tile
// colours. The diary grid, the tile action menu and the booking form all read
// from here so they can never drift apart.
//
// Colours follow the MechanicDesk diary: requested = awaiting confirmation,
// grey = accepted but not started, blue = in progress, green = finished.
// Cancelled is muted and struck through — the slot fell through rather than
// simply not having been picked up yet.
export const BOOKING_STATUSES: {
  value: BookingStatus;
  label: string;
  tile: string;
  dot: string;
}[] = [
  { value: 'requested', label: 'Requested', tile: 'bg-amber-50 border-amber-300 hover:bg-amber-100', dot: 'bg-amber-400' },
  { value: 'accepted',  label: 'Accepted',  tile: 'bg-gray-100 border-gray-300 hover:bg-gray-200',   dot: 'bg-gray-400' },
  { value: 'started',   label: 'Started',   tile: 'bg-blue-50 border-blue-300 hover:bg-blue-100',    dot: 'bg-blue-500' },
  { value: 'finished',  label: 'Finished',  tile: 'bg-green-50 border-green-300 hover:bg-green-100', dot: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', tile: 'bg-gray-50 border-gray-200 hover:bg-gray-100 opacity-60', dot: 'bg-gray-300' },
];

export const STATUS_STYLES = Object.fromEntries(
  BOOKING_STATUSES.map(s => [s.value, s]),
) as Record<BookingStatus, (typeof BOOKING_STATUSES)[number]>;

export const statusLabel = (s: BookingStatus) => STATUS_STYLES[s]?.label ?? s;

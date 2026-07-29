import { format, isSameDay } from 'date-fns';
import { Ban, CalendarCheck } from 'lucide-react';

import type { Booking } from '@/types/Booking';
import BookingTile from './BookingTile';

/**
 * The seven-day grid. Greying is derived server-side (advance notice, weekdays
 * and overrides), so this only renders what it is told.
 */
export default function WeekGrid({
  days, bookings, unavailableDays, isLoading, mdMode, openDayDate, menuRef,
  onToggleDayMenu, onSetOverride, onBookingClick,
}: {
  days: Date[];
  bookings: Booking[];
  unavailableDays: Set<string>;
  isLoading: boolean;
  /** MechanicDesk owns blocked dates — the operator can't override them here. */
  mdMode: boolean;
  openDayDate: string | null;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onToggleDayMenu: (dayStr: string) => void;
  onSetOverride: (dayStr: string, available: boolean) => void;
  onBookingClick: (e: React.MouseEvent, bookingId: number) => void;
}) {
  const today = new Date();
  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 min-w-[900px] border border-[var(--border-light)] rounded-lg overflow-hidden">
        {days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const isGreyed = unavailableDays.has(dayStr);       // matches the booking form
          const dayBookings = bookings.filter(b =>
            isSameDay(new Date(b.drop_off_date + 'T00:00:00'), day));
          const isToday = isSameDay(day, today);
          return (
            <div
              key={dayStr}
              className={`min-h-[400px] flex flex-col border-r border-[var(--border-light)] last:border-r-0 ${
                isGreyed ? 'bg-gray-200' : 'bg-white'
              }`}
            >
              {/* Day header */}
              <div className="relative border-b border-[var(--border-light)] px-2 py-2">
                <button onClick={() => onToggleDayMenu(dayStr)} className="w-full text-left">
                  <p className={`text-xs uppercase tracking-wide ${isToday ? 'text-[var(--highlight)] font-bold' : 'text-gray-500'}`}>
                    {format(day, 'EEE')}
                  </p>
                  <p className={`text-lg font-bold ${isToday ? 'text-[var(--highlight)]' : 'text-gray-800'}`}>
                    {format(day, 'd MMM')}
                  </p>
                </button>

                {openDayDate === dayStr && (
                  <div ref={menuRef} className="absolute z-10 left-2 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-52">
                    {mdMode ? (
                      <p className="px-3 py-2 text-xs text-gray-500 leading-snug">
                        Blocked days are managed in MechanicDesk while it&rsquo;s the active source.
                      </p>
                    ) : isGreyed ? (
                      <button
                        onClick={() => onSetOverride(dayStr, true)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <CalendarCheck className="h-4 w-4" /> Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => onSetOverride(dayStr, false)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Ban className="h-4 w-4" /> Block this day
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Tiles — flush to the column edges to maximise space.
                  Clicking empty space (not a tile) opens the block menu. */}
              <div
                className="flex-1 overflow-y-auto cursor-pointer"
                onClick={() => onToggleDayMenu(dayStr)}
              >
                {isLoading ? (
                  <p className="text-xs text-gray-400 text-center pt-4">Loading…</p>
                ) : dayBookings.length ? (
                  dayBookings.map(b => (
                    <BookingTile key={b.id} booking={b} onClick={(e) => onBookingClick(e, b.id)} />
                  ))
                ) : (
                  !isGreyed && <p className="text-xs text-gray-300 text-center pt-4">No jobs</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

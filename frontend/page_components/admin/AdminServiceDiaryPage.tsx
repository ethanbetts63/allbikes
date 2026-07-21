"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addDays, startOfWeek, format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Ban, CalendarCheck, Search, X } from 'lucide-react';
import {
  adminGetBookings,
  adminGetBlockedDates,
  adminBlockDate,
  adminMakeDateAvailable,
  adminUnblockDate,
  adminGetDiaryUnavailableDays,
  adminGetServiceSettings,
} from '@/api';
import type { Booking, BookingStatus, BlockedDate } from '@/types/Booking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Tile styling per job status. Colours follow the MechanicDesk diary:
// requested = awaiting confirmation, grey = not started, blue = in progress,
// green = finished & paid.
const STATUS_STYLES: Record<BookingStatus, { tile: string; dot: string; label: string }> = {
  requested:     { tile: 'bg-amber-50 border-amber-300 hover:bg-amber-100',   dot: 'bg-amber-400',   label: 'Requested' },
  not_started:   { tile: 'bg-gray-100 border-gray-300 hover:bg-gray-200',     dot: 'bg-gray-400',    label: 'Not started' },
  in_progress:   { tile: 'bg-blue-50 border-blue-300 hover:bg-blue-100',      dot: 'bg-blue-500',    label: 'In progress' },
  finished_paid: { tile: 'bg-green-50 border-green-300 hover:bg-green-100',    dot: 'bg-green-500',   label: 'Finished & paid' },
};

const formatTime = (t: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${m} ${period}`;
};

const vehicleLabel = (b: Booking) =>
  [b.year, b.make, b.model].filter(Boolean).join(' ').trim();

const BookingTile = ({ booking, onClick }: { booking: Booking; onClick: (e: React.MouseEvent) => void }) => {
  const style = STATUS_STYLES[booking.status];
  const time = formatTime(booking.drop_off_time);
  const bike = vehicleLabel(booking);
  return (
    <button
      onClick={onClick}
      className={`w-full text-left border-b border-black/10 p-2.5 transition-colors ${style.tile}`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
        <span className="text-xs font-bold text-gray-800">{time ?? 'No time'}</span>
      </div>
      {(bike || booking.registration) && (
        <p className="text-xs font-semibold text-gray-900 leading-snug">
          {bike}
          {booking.registration && <span className="font-mono font-normal text-gray-600"> · {booking.registration}</span>}
        </p>
      )}
      <p className="text-xs text-gray-700 leading-snug">
        {booking.customer_name}
        {booking.customer_phone && <span className="text-gray-500"> · {booking.customer_phone}</span>}
      </p>
      {booking.job_description && (
        <p className="text-[11px] text-gray-500 leading-snug mt-1">{booking.job_description}</p>
      )}
    </button>
  );
};

const SearchResultsList = ({
  results,
  isSearching,
  onOpen,
}: {
  results: Booking[];
  isSearching: boolean;
  onOpen: (id: number) => void;
}) => {
  if (isSearching && results.length === 0) {
    return <p className="text-sm text-[var(--text-dark-secondary)] py-8 text-center">Searching…</p>;
  }
  if (results.length === 0) {
    return <p className="text-sm text-[var(--text-dark-secondary)] py-8 text-center">No bookings match your search.</p>;
  }
  return (
    <div className="border border-[var(--border-light)] rounded-lg overflow-hidden bg-white">
      {results.map(b => {
        const style = STATUS_STYLES[b.status];
        const bike = vehicleLabel(b);
        return (
          <button
            key={b.id}
            onClick={() => onOpen(b.id)}
            className="w-full text-left flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
          >
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1.5 ${style.dot}`} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-semibold text-gray-900">{b.customer_name}</span>
                {b.customer_phone && <span className="text-xs text-gray-500">{b.customer_phone}</span>}
              </div>
              {(bike || b.registration) && (
                <p className="text-xs text-gray-700">
                  {bike}
                  {b.registration && <span className="font-mono text-gray-500"> · {b.registration}</span>}
                </p>
              )}
              {b.job_description && <p className="text-xs text-gray-500 truncate">{b.job_description}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-gray-800">{format(new Date(b.drop_off_date + 'T00:00:00'), 'EEE d MMM yyyy')}</p>
              <p className="text-xs text-gray-500">{formatTime(b.drop_off_time) ?? 'No time'} · {style.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

const AdminServiceDiaryPage = () => {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [unavailableDays, setUnavailableDays] = useState<Set<string>>(new Set());
  const [mdMode, setMdMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuDate, setMenuDate] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Search — when the query is non-empty the diary shows a flat results list
  // instead of the weekly grid.
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searching = search.trim().length > 0;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const rangeStart = format(weekStart, 'yyyy-MM-dd');
  const rangeEnd = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [b, blocked, unavailable, settings] = await Promise.all([
          adminGetBookings({ start: rangeStart, end: rangeEnd }),
          adminGetBlockedDates({ start: rangeStart, end: rangeEnd }),
          adminGetDiaryUnavailableDays(rangeStart, rangeEnd),
          adminGetServiceSettings(),
        ]);
        if (cancelled) return;
        setBookings(b);
        setBlockedDates(blocked);
        setUnavailableDays(new Set(unavailable));
        setMdMode(settings.use_mechanic_desk_blocked_dates);
      } catch {
        if (!cancelled) setError('Failed to load the diary.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [rangeStart, rangeEnd]);

  // Debounced booking search.
  useEffect(() => {
    const q = search.trim();
    let cancelled = false;
    const run = async () => {
      if (!q) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await adminGetBookings({ search: q });
        if (!cancelled) setSearchResults(results);
      } catch {
        if (!cancelled) setError('Search failed.');
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };
    const t = setTimeout(run, q ? 300 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [search]);

  // Close the day menu on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuDate(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const bookingsForDay = (day: Date) =>
    bookings.filter(b => isSameDay(new Date(b.drop_off_date + 'T00:00:00'), day));

  // The one-off override row for a day, if any (available=true forces it open,
  // available=false forces it closed).
  const overrideForDay = (day: Date) =>
    blockedDates.find(bd => bd.date === format(day, 'yyyy-MM-dd'));

  // Greying is derived server-side (advance notice + weekdays + overrides), so
  // re-fetch it after any change to reflect it immediately.
  const refreshUnavailable = async () => {
    const refreshed = await adminGetDiaryUnavailableDays(rangeStart, rangeEnd);
    setUnavailableDays(new Set(refreshed));
  };

  // Force a day open (exception to the rules) or closed.
  const handleSetOverride = async (dayStr: string, available: boolean) => {
    setMenuDate(null);
    try {
      const row = available ? await adminMakeDateAvailable(dayStr) : await adminBlockDate(dayStr);
      setBlockedDates(prev => [...prev.filter(bd => bd.date !== dayStr), row]);
      await refreshUnavailable();
    } catch {
      setError('Failed to update the day.');
    }
  };

  // Clear an override, returning the day to the default rules.
  const handleResetOverride = async (dayStr: string) => {
    setMenuDate(null);
    try {
      await adminUnblockDate(dayStr);
      setBlockedDates(prev => prev.filter(bd => bd.date !== dayStr));
      await refreshUnavailable();
    } catch {
      setError('Failed to reset the day.');
    }
  };

  const today = new Date();

  // White button with black details — the default outline variant renders too
  // dark against this page background to read.
  const navBtnClass = 'bg-white text-black border border-gray-300 hover:bg-gray-100 hover:text-black';

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-dark-primary)] flex items-center gap-2">
          <CalendarCheck className="h-6 w-6" /> Service Diary
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(w => addDays(w, -7))} className={navBtnClass}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(w => addDays(w, 7))} className={navBtnClass}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => router.push('/dashboard/service-diary/new')} className="ml-2">
            <Plus className="h-4 w-4 mr-1" /> Add Booking
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search bookings — name, rego, phone, make…"
          className="pl-9 pr-9 bg-white text-black"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!searching && (
        <p className="text-sm text-[var(--text-dark-secondary)] mb-4">
          {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 6), 'd MMM yyyy')}
        </p>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {searching ? (
        <SearchResultsList
          results={searchResults}
          isSearching={isSearching}
          onOpen={(id) => router.push(`/dashboard/service-diary/${id}`)}
        />
      ) : (
      <>
      {/* Week grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 min-w-[900px] border border-[var(--border-light)] rounded-lg overflow-hidden">
          {days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const isGreyed = unavailableDays.has(dayStr);       // matches the booking form
            const hasOverride = !!overrideForDay(day);           // an explicit exception we can clear
            const dayBookings = bookingsForDay(day);
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
                  <button
                    onClick={() => setMenuDate(menuDate === dayStr ? null : dayStr)}
                    className="w-full text-left"
                  >
                    <p className={`text-xs uppercase tracking-wide ${isToday ? 'text-[var(--highlight)] font-bold' : 'text-gray-500'}`}>
                      {format(day, 'EEE')}
                    </p>
                    <p className={`text-lg font-bold ${isToday ? 'text-[var(--highlight)]' : 'text-gray-800'}`}>
                      {format(day, 'd MMM')}
                    </p>
                  </button>

                  {menuDate === dayStr && (
                    <div ref={menuRef} className="absolute z-10 left-2 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 w-52">
                      {mdMode ? (
                        <p className="px-3 py-2 text-xs text-gray-500 leading-snug">
                          Blocked days are managed in MechanicDesk while it&rsquo;s the active source.
                        </p>
                      ) : (
                        <>
                          {isGreyed ? (
                            <button
                              onClick={() => handleSetOverride(dayStr, true)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <CalendarCheck className="h-4 w-4" />
                              Make available (exception)
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetOverride(dayStr, false)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Ban className="h-4 w-4" />
                              Block this day
                            </button>
                          )}
                          {hasOverride && (
                            <button
                              onClick={() => handleResetOverride(dayStr)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Reset to default
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Tiles — flush to the column edges to maximise space.
                    Clicking empty space (not a tile) opens the block menu. */}
                <div
                  className="flex-1 overflow-y-auto cursor-pointer"
                  onClick={() => setMenuDate(menuDate === dayStr ? null : dayStr)}
                >
                  {isLoading ? (
                    <p className="text-xs text-gray-400 text-center pt-4">Loading…</p>
                  ) : dayBookings.length ? (
                    dayBookings.map(b => (
                      <BookingTile
                        key={b.id}
                        booking={b}
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/service-diary/${b.id}`); }}
                      />
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-[var(--text-dark-secondary)]">
        {(Object.keys(STATUS_STYLES) as BookingStatus[]).map(s => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${STATUS_STYLES[s].dot}`} />
            {STATUS_STYLES[s].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-gray-300" /> Unavailable / blocked
        </span>
      </div>
      </>
      )}
    </div>
  );
};

export default AdminServiceDiaryPage;

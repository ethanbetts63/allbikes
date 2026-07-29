'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addDays, startOfWeek, format, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, CalendarCheck, Search, X } from 'lucide-react';

import {
  adminGetBookings,
  adminBlockDate,
  adminMakeDateAvailable,
  adminGetDiaryUnavailableDays,
  adminGetServiceSettings,
  adminUpdateBooking,
  adminDeleteBooking,
} from '@/lib/api';
import type { Booking, BookingStatus } from '@/types/Booking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DIARY_PATH, diaryWeekHref } from '../_lib/diary';
import BookingActionMenu from './BookingActionMenu';
import DiaryLegend from './DiaryLegend';
import SearchResultsList from './SearchResultsList';
import WeekGrid from './WeekGrid';

// Which popover is open, if any. Day menus are anchored to their column header;
// booking menus are positioned at the click point because the tile list
// scrolls and would clip an absolutely-positioned child.
type OpenMenu =
  | { kind: 'day'; date: string }
  | { kind: 'booking'; id: number; x: number; y: number }
  | null;

// White button with black details — the default outline variant renders too
// dark against this page background to read.
const navBtnClass = 'bg-white text-black border border-gray-300 hover:bg-gray-100 hover:text-black';

export default function ServiceDiary() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The visible week lives in the URL (?week=YYYY-MM-DD) so it can be linked to
  // and stepped through with the back button — and so creating a booking can
  // land back on the week that booking belongs to. Absent/invalid falls back to
  // the current week.
  const weekParam = searchParams.get('week');
  const weekStart = useMemo(() => {
    const parsed = weekParam ? new Date(weekParam + 'T00:00:00') : null;
    return startOfWeek(parsed && isValid(parsed) ? parsed : new Date(), { weekStartsOn: 1 });
  }, [weekParam]);
  const goToWeek = (date: Date) => router.push(diaryWeekHref(date));

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [unavailableDays, setUnavailableDays] = useState<Set<string>>(new Set());
  const [mdMode, setMdMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuDate = openMenu?.kind === 'day' ? openMenu.date : null;
  const menuBooking =
    openMenu?.kind === 'booking' ? bookings.find(b => b.id === openMenu.id) ?? null : null;

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
        const [b, unavailable, settings] = await Promise.all([
          adminGetBookings({ start: rangeStart, end: rangeEnd }),
          adminGetDiaryUnavailableDays(rangeStart, rangeEnd),
          adminGetServiceSettings(),
        ]);
        if (cancelled) return;
        setBookings(b);
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

  // Close whichever menu is open on outside click or Escape.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // Greying is derived server-side (advance notice + weekdays + overrides), so
  // re-fetch it after any change to reflect it immediately.
  const refreshUnavailable = async () => {
    const refreshed = await adminGetDiaryUnavailableDays(rangeStart, rangeEnd);
    setUnavailableDays(new Set(refreshed));
  };

  const toggleDayMenu = (dayStr: string) =>
    setOpenMenu(menuDate === dayStr ? null : { kind: 'day', date: dayStr });

  // Open the tile action menu at the click point, clamped to stay on screen.
  const openBookingMenu = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const MENU_W = 224;
    const MENU_H = 320;
    setOpenMenu({
      kind: 'booking',
      id,
      x: Math.max(8, Math.min(e.clientX, window.innerWidth - MENU_W - 8)),
      y: Math.max(8, Math.min(e.clientY, window.innerHeight - MENU_H - 8)),
    });
  };

  // Status changes apply straight away — the tile recolours optimistically and
  // rolls back if the request fails.
  const handleSetStatus = async (id: number, status: BookingStatus) => {
    setOpenMenu(null);
    const previous = bookings;
    setBookings(bs => bs.map(b => (b.id === id ? { ...b, status } : b)));
    try {
      const updated = await adminUpdateBooking(id, { status });
      setBookings(bs => bs.map(b => (b.id === id ? updated : b)));
    } catch {
      setBookings(previous);
      setError('Failed to update the job status.');
    }
  };

  const handleDeleteBooking = async (id: number) => {
    setOpenMenu(null);
    if (!confirm('Delete this booking? This cannot be undone.')) return;
    try {
      await adminDeleteBooking(id);
      setBookings(bs => bs.filter(b => b.id !== id));
    } catch {
      setError('Failed to delete the booking.');
    }
  };

  // Force a day open (exception to the rules) or closed.
  const handleSetOverride = async (dayStr: string, available: boolean) => {
    setOpenMenu(null);
    try {
      await (available ? adminMakeDateAvailable(dayStr) : adminBlockDate(dayStr));
      await refreshUnavailable();
    } catch {
      setError('Failed to update the day.');
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-[var(--text-dark-primary)] flex items-center gap-2">
          <CalendarCheck className="h-6 w-6" /> Service Diary
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goToWeek(addDays(weekStart, -7))} className={navBtnClass}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => goToWeek(addDays(weekStart, 7))} className={navBtnClass}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => router.push(`${DIARY_PATH}/new`)} className="ml-2">
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
          onOpen={(id) => router.push(`${DIARY_PATH}/${id}`)}
        />
      ) : (
        <>
          <WeekGrid
            days={days}
            bookings={bookings}
            unavailableDays={unavailableDays}
            isLoading={isLoading}
            mdMode={mdMode}
            openDayDate={menuDate}
            menuRef={menuRef}
            onToggleDayMenu={toggleDayMenu}
            onSetOverride={handleSetOverride}
            onBookingClick={openBookingMenu}
          />
          <DiaryLegend />
        </>
      )}

      {menuBooking && openMenu?.kind === 'booking' && (
        <BookingActionMenu
          booking={menuBooking}
          x={openMenu.x}
          y={openMenu.y}
          menuRef={menuRef}
          onEdit={() => { setOpenMenu(null); router.push(`${DIARY_PATH}/${menuBooking.id}`); }}
          onSetStatus={(s) => handleSetStatus(menuBooking.id, s)}
          onDelete={() => handleDeleteBooking(menuBooking.id)}
        />
      )}
    </div>
  );
}

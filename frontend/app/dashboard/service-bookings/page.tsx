'use client';

import { useState, useEffect } from 'react';

import { adminGetBookingLogs, adminDeleteBookingLog } from '@/api';
import type { BookingRequestLog } from '@/types/BookingRequestLog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BookingLogFilters from './_components/BookingLogFilters';
import PaginationBar from '@/components/ui/pagination-bar';
import BookingLogsTable from './_components/BookingLogsTable';
import type { BookingLogFilter } from './_lib/bookingLogStatus';

export default function AdminServiceBookingsDashboardPage() {
  const [data, setData] = useState<BookingRequestLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BookingLogFilter>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminGetBookingLogs({ status: filter === 'failed' ? 'Failed' : undefined, page })
      .then((result) => {
        if (cancelled) return;
        setData(result.results);
        setTotalCount(result.count);
        setHasNext(!!result.next);
        setHasPrev(!!result.previous);
      })
      .catch(() => { if (!cancelled) setError('Failed to load booking logs.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [filter, page]);

  // Loading is flipped by whatever triggers a refetch rather than by the effect
  // itself, which keeps every setState out of the effect body.
  const changeFilter = (next: BookingLogFilter) => {
    setIsLoading(true);
    setFilter(next);
    setPage(1);
  };

  const goToPage = (nextPage: number) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Delete this booking log?')) return;
    try {
      await adminDeleteBookingLog(id);
      setData(prev => prev.filter(log => log.id !== id));
      setTotalCount(prev => prev - 1);
    } catch {
      setError('Failed to delete booking log.');
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Service Bookings</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="w-full bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] p-4 rounded-lg">
        <BookingLogFilters filter={filter} onChange={changeFilter} />

        {isLoading ? (
          <p className="text-center text-[var(--text-dark-secondary)] py-8">Loading...</p>
        ) : (
          <>
            <BookingLogsTable logs={data} onDelete={handleDelete} />
            <PaginationBar
              summary={`${totalCount} booking${totalCount !== 1 ? 's' : ''} total`}
              hasPrevious={hasPrev}
              hasNext={hasNext}
              onPrevious={() => goToPage(page - 1)}
              onNext={() => goToPage(page + 1)}
            />
          </>
        )}
      </div>
    </div>
  );
}

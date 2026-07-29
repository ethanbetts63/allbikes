'use client';

import { useState, useEffect } from 'react';

import { adminGetHireBookings, adminDeleteHireBooking } from '@/api';
import type { HireBooking } from '@/types/HireBooking';
import type { PaginatedResponse } from '@/types/PaginatedResponse';
import { Spinner } from '@/components/ui/spinner';
import HireBookingsTable from './_components/HireBookingsTable';
import HirePagination from './_components/HirePagination';
import { FILTER_STATUS_OPTIONS } from './_lib/hireStatus';

export default function AdminHireDashboardPage() {
  const [data, setData] = useState<PaginatedResponse<HireBooking> | null>(null);
  const [statusFilter, setStatusFilter] = useState('confirmed,active');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adminGetHireBookings(statusFilter || undefined, page)
      .then((response) => { if (!cancelled) setData(response); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [statusFilter, page]);

  // Loading is flipped by whatever triggers a refetch rather than by the effect
  // itself, which keeps every setState out of the effect body.
  const changeFilter = (value: string) => {
    setData(null);
    setIsLoading(true);
    setStatusFilter(value);
    setPage(1);
  };

  const goToPage = (nextPage: number) => {
    setData(null);
    setIsLoading(true);
    setPage(nextPage);
  };

  const handleDelete = async (booking: HireBooking) => {
    if (!window.confirm(`Delete booking ${booking.booking_reference}? This cannot be undone.`)) return;
    await adminDeleteHireBooking(booking.id);
    setData(prev =>
      prev ? { ...prev, results: prev.results.filter(b => b.id !== booking.id) } : prev);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Hire Bookings</h1>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => changeFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {FILTER_STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center pt-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : (
        <>
          <HireBookingsTable bookings={data?.results ?? []} onDelete={handleDelete} />
          <HirePagination
            count={data?.count ?? 0}
            hasPrevious={Boolean(data?.previous)}
            hasNext={Boolean(data?.next)}
            onPrevious={() => goToPage(page - 1)}
            onNext={() => goToPage(page + 1)}
          />
        </>
      )}
    </div>
  );
}

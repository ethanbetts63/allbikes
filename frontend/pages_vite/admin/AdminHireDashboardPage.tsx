import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetHireBookings, adminDeleteHireBooking } from '@/api';
import type { HireBooking } from '@/types/HireBooking';
import type { PaginatedResponse } from '@/types/PaginatedResponse';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'active', label: 'Active' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_BADGE: Record<string, string> = {
  pending_payment: 'border-amber-500 text-[var(--highlight)]',
  confirmed: 'border-green-600 text-green-700',
  active: 'border-blue-500 text-blue-700',
  returned: 'text-[var(--text-dark-secondary)] border-gray-400',
  cancelled: 'border-red-500 text-destructive',
};

const AdminHireDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<HireBooking> | null>(null);
  const [statusFilter, setStatusFilter] = useState('confirmed,active');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    adminGetHireBookings(statusFilter || undefined, page)
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [statusFilter, page]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-dark-primary)]">Hire Bookings</h1>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map(opt => (
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
          <div className="bg-[var(--bg-light-primary)] rounded-lg border border-border-light overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-light text-xs text-[var(--text-dark-secondary)] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Reference</th>
                  <th className="text-left px-4 py-3 font-semibold">Motorcycle</th>
                  <th className="text-left px-4 py-3 font-semibold">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold">Dates</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data?.results.map(booking => (
                  <tr
                    key={booking.id}
                    onClick={() => navigate(`/dashboard/hire/${booking.id}`)}
                    className="hover:bg-[var(--bg-light-secondary)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-[var(--text-dark-primary)]">
                      {booking.booking_reference}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-dark-secondary)]">{booking.motorcycle_name}</td>
                    <td className="px-4 py-3 text-[var(--text-dark-secondary)]">{booking.customer_name}</td>
                    <td className="px-4 py-3 text-[var(--text-dark-secondary)]">
                      {booking.hire_start} → {booking.hire_end}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${STATUS_BADGE[booking.status] ?? ''}`}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`Delete booking ${booking.booking_reference}? This cannot be undone.`)) return;
                          await adminDeleteHireBooking(booking.id);
                          setData(prev => prev ? { ...prev, results: prev.results.filter(b => b.id !== booking.id) } : prev);
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {data?.results.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-dark-secondary)]">
                      No bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.count > 50 && (
            <div className="flex justify-between items-center mt-4 text-sm text-[var(--text-dark-secondary)]">
              <button
                disabled={!data.previous}
                onClick={() => setPage(p => p - 1)}
                className="disabled:opacity-40"
              >
                ← Previous
              </button>
              <span>{data.count} total</span>
              <button
                disabled={!data.next}
                onClick={() => setPage(p => p + 1)}
                className="disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminHireDashboardPage;

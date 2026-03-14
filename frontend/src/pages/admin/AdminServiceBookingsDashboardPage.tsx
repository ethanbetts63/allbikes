import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminGetBookingLogs } from '@/api';
import type { BookingRequestLog } from '@/types/BookingRequestLog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_BADGE: Record<string, string> = {
  Success: 'border-green-600 text-highlight1',
  Failed:  'border-red-500 text-destructive',
};

type FilterType = 'all' | 'failed';

const AdminServiceBookingsDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<BookingRequestLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const result = await adminGetBookingLogs({
          status: filter === 'failed' ? 'Failed' : undefined,
          page,
        });
        setData(result.results);
        setTotalCount(result.count);
        setHasNext(!!result.next);
        setHasPrev(!!result.previous);
      } catch {
        setError('Failed to load booking logs.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [filter, page]);

  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-light-primary)]">Service Bookings</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="w-full bg-white text-[var(--text-dark-primary)] p-4 rounded-lg">
        <div className="flex items-center space-x-2 py-4">
          <Button
            variant="outline"
            onClick={() => handleFilterChange('all')}
            className={filter === 'all' ? 'bg-white text-[var(--text-dark-primary)] border-black' : 'bg-gray-200 text-[var(--text-dark-primary)] border-black hover:bg-gray-300'}
          >
            All
          </Button>
          <Button
            variant="outline"
            onClick={() => handleFilterChange('failed')}
            className={filter === 'failed' ? 'bg-white text-[var(--text-dark-primary)] border-black' : 'bg-gray-200 text-[var(--text-dark-primary)] border-black hover:bg-gray-300'}
          >
            Failed
          </Button>
        </div>

        {isLoading ? (
          <p className="text-center text-[var(--text-dark-secondary)] py-8">Loading...</p>
        ) : (
          <>
            <div className="rounded-md border border-gray-300">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-300">
                    <TableHead className="text-[var(--text-dark-primary)]">Customer</TableHead>
                    <TableHead className="text-[var(--text-dark-primary)]">Vehicle Reg</TableHead>
                    <TableHead className="text-[var(--text-dark-primary)]">Status</TableHead>
                    <TableHead className="text-[var(--text-dark-primary)]">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.length ? (
                    data.map(log => (
                      <TableRow
                        key={log.id}
                        className="border-gray-300 cursor-pointer hover:bg-stone-50"
                        onClick={() => navigate(`/dashboard/service-bookings/${log.id}`)}
                      >
                        <TableCell className="text-[var(--text-dark-primary)]">
                          <div className="font-medium">{log.customer_name}</div>
                          <div className="text-[var(--text-dark-secondary)] text-xs">{log.customer_email}</div>
                        </TableCell>
                        <TableCell className="text-[var(--text-dark-primary)] text-sm font-mono">
                          {log.vehicle_registration ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_BADGE[log.status] ?? 'text-[var(--text-dark-secondary)] border-gray-400'}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[var(--text-dark-primary)] text-sm">
                          {new Date(log.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-[var(--text-dark-primary)]">
                        No booking logs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-[var(--text-dark-secondary)]">{totalCount} booking{totalCount !== 1 ? 's' : ''} total</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={!hasPrev} className="text-[var(--text-dark-primary)] border-gray-300">
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext} className="text-[var(--text-dark-primary)] border-gray-300">
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminServiceBookingsDashboardPage;

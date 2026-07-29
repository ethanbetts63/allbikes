'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { adminGetBookingLog, adminDeleteBookingLog } from '@/api';
import type { BookingRequestLog } from '@/types/BookingRequestLog';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BookingLogApiResponse from '../_components/BookingLogApiResponse';
import BookingLogHeader from '../_components/BookingLogHeader';
import BookingLogRequest from '../_components/BookingLogRequest';
import type { BookingLogPayload } from '../_lib/bookingLogStatus';

export default function AdminServiceBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [log, setLog] = useState<BookingRequestLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    adminGetBookingLog(Number(id))
      .then((data) => { if (!cancelled) setLog(data); })
      .catch(() => { if (!cancelled) setError('Failed to load booking log.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('Delete this booking log?')) return;
    try {
      await adminDeleteBookingLog(Number(id));
      router.push('/dashboard/service-bookings');
    } catch {
      setError('Failed to delete booking log.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (error || !log) {
    return <p className="text-destructive">{error ?? 'Booking log not found.'}</p>;
  }

  const payload = log.request_payload as BookingLogPayload;

  return (
    <div className="p-4 md:p-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="w-full bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] p-4 rounded-lg">
        <BookingLogHeader log={log} onDelete={handleDelete} />
        <BookingLogRequest log={log} payload={payload} />
        <BookingLogApiResponse log={log} />

        <Link
          href="/dashboard/service-bookings"
          className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
        >
          ← Back to Service Bookings
        </Link>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminGetBookingLog } from '@/api';
import type { BookingRequestLog } from '@/types/BookingRequestLog';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STATUS_BADGE: Record<string, string> = {
  Success: 'border-green-600 text-highlight1',
  Failed:  'border-red-500 text-destructive',
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
    <span className="text-[var(--text-dark-primary)] font-semibold text-sm w-40 shrink-0">{label}</span>
    <span className="text-[var(--text-dark-secondary)] text-sm text-right">{value}</span>
  </div>
);

const AdminServiceBookingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [log, setLog] = useState<BookingRequestLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchLog = async () => {
      try {
        const data = await adminGetBookingLog(Number(id));
        setLog(data);
      } catch {
        setError('Failed to load booking log.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLog();
  }, [id]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = log.request_payload as Record<string, any>;
  const jobTypes = Array.isArray(payload.job_type_names)
    ? (payload.job_type_names as string[]).join(', ')
    : '—';

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="w-full bg-white text-[var(--text-dark-primary)] p-4 rounded-lg">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-dark-primary)] mb-1">{log.customer_name}</h1>
            <Badge variant="outline" className={STATUS_BADGE[log.status] ?? 'text-[var(--text-dark-secondary)] border-gray-400'}>
              {log.status}
            </Badge>
          </div>
          <span className="text-sm text-[var(--text-dark-secondary)]">
            {new Date(log.created_at).toLocaleString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Customer */}
        <div className="mb-6">
          <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">Customer</h2>
          <Row label="Name" value={log.customer_name} />
          <Row label="Email" value={log.customer_email} />
          {payload.phone && <Row label="Phone" value={String(payload.phone)} />}
        </div>

        {/* Vehicle */}
        <div className="mb-6">
          <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">Vehicle</h2>
          {log.vehicle_registration && <Row label="Registration" value={log.vehicle_registration} />}
          {payload.make && <Row label="Make" value={String(payload.make)} />}
          {payload.model && <Row label="Model" value={String(payload.model)} />}
          {payload.year && <Row label="Year" value={String(payload.year)} />}
          {payload.odometer && <Row label="Odometer" value={String(payload.odometer)} />}
        </div>

        {/* Service Request */}
        <div className="mb-6">
          <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">Service Request</h2>
          <Row label="Job Types" value={jobTypes} />
          {payload.drop_off_time && <Row label="Drop-off Time" value={String(payload.drop_off_time)} />}
          {payload.courtesy_vehicle_requested && (
            <Row label="Courtesy Vehicle" value={payload.courtesy_vehicle_requested === 'true' ? 'Yes' : 'No'} />
          )}
          {payload.note && (
            <div className="py-2 border-b border-gray-100">
              <span className="text-[var(--text-dark-primary)] font-semibold text-sm">Note</span>
              <p className="text-[var(--text-dark-secondary)] text-sm mt-1 whitespace-pre-wrap">{String(payload.note)}</p>
            </div>
          )}
        </div>

        {/* API Response */}
        <div className="mb-6">
          <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">API Response</h2>
          <Row label="Status Code" value={String(log.response_status_code)} />
          <div className="py-2">
            <span className="text-[var(--text-dark-primary)] font-semibold text-sm">Response Body</span>
            <pre className="mt-1 text-xs text-[var(--text-dark-secondary)] bg-gray-50 rounded p-3 overflow-auto">
              {JSON.stringify(log.response_body, null, 2)}
            </pre>
          </div>
        </div>

        <Link to="/dashboard/service-bookings" className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2">
          ← Back to Service Bookings
        </Link>

      </div>
    </div>
  );
};

export default AdminServiceBookingDetailPage;

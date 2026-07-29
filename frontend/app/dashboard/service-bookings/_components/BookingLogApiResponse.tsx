import type { BookingRequestLog } from '@/types/BookingRequestLog';
import DetailRow from './DetailRow';

/** What MechanicDesk returned — the reason a log is marked Failed. */
export default function BookingLogApiResponse({ log }: { log: BookingRequestLog }) {
  return (
    <div className="mb-6">
      <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">API Response</h2>
      <DetailRow label="Status Code" value={String(log.response_status_code)} />
      <div className="py-2">
        <span className="text-[var(--text-dark-primary)] font-semibold text-sm">Response Body</span>
        <pre className="mt-1 text-xs text-[var(--text-dark-secondary)] bg-[var(--bg-light-secondary)] rounded p-3 overflow-auto">
          {JSON.stringify(log.response_body, null, 2)}
        </pre>
      </div>
    </div>
  );
}

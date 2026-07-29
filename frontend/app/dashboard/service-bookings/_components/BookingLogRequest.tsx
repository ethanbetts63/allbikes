import type { BookingRequestLog } from '@/types/BookingRequestLog';
import DetailRow from './DetailRow';
import { type BookingLogPayload, payloadText } from '../_lib/bookingLogStatus';

/**
 * The three panels rendered straight out of the submitted payload: who, what
 * vehicle, and what they asked for.
 *
 * The payload is whatever the public form posted, so every field is optional
 * and rendered only when present.
 */
export default function BookingLogRequest({ log, payload }: {
  log: BookingRequestLog;
  payload: BookingLogPayload;
}) {
  const jobTypes = Array.isArray(payload.job_type_names)
    ? (payload.job_type_names as string[]).join(', ')
    : '—';

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">Customer</h2>
        <DetailRow label="Name" value={log.customer_name} />
        <DetailRow label="Email" value={log.customer_email} />
        {payload.phone ? <DetailRow label="Phone" value={payloadText(payload.phone)} /> : null}
      </div>

      <div className="mb-6">
        <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">Vehicle</h2>
        {log.vehicle_registration && <DetailRow label="Registration" value={log.vehicle_registration} />}
        {payload.make ? <DetailRow label="Make" value={payloadText(payload.make)} /> : null}
        {payload.model ? <DetailRow label="Model" value={payloadText(payload.model)} /> : null}
        {payload.year ? <DetailRow label="Year" value={payloadText(payload.year)} /> : null}
        {payload.odometer ? <DetailRow label="Odometer" value={payloadText(payload.odometer)} /> : null}
      </div>

      <div className="mb-6">
        <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">Service Request</h2>
        <DetailRow label="Job Types" value={jobTypes} />
        {payload.drop_off_time ? (
          <DetailRow label="Drop-off Time" value={payloadText(payload.drop_off_time)} />
        ) : null}
        {payload.courtesy_vehicle_requested ? (
          <DetailRow
            label="Courtesy Vehicle"
            value={payload.courtesy_vehicle_requested === 'true' ? 'Yes' : 'No'}
          />
        ) : null}
        {payload.note ? (
          <div className="py-2 border-b border-gray-100">
            <span className="text-[var(--text-dark-primary)] font-semibold text-sm">Note</span>
            <p className="text-[var(--text-dark-secondary)] text-sm mt-1 whitespace-pre-wrap">
              {payloadText(payload.note)}
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

import type { BookingRequestLog } from '@/types/BookingRequestLog';
import DetailRow from '@/components/ui/detail-row';
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
        <DetailRow labelWidth="w-40" label="Name" value={log.customer_name} />
        <DetailRow labelWidth="w-40" label="Email" value={log.customer_email} />
        {payload.phone ? <DetailRow labelWidth="w-40" label="Phone" value={payloadText(payload.phone)} /> : null}
      </div>

      <div className="mb-6">
        <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">Vehicle</h2>
        {log.vehicle_registration && <DetailRow labelWidth="w-40" label="Registration" value={log.vehicle_registration} />}
        {payload.make ? <DetailRow labelWidth="w-40" label="Make" value={payloadText(payload.make)} /> : null}
        {payload.model ? <DetailRow labelWidth="w-40" label="Model" value={payloadText(payload.model)} /> : null}
        {payload.year ? <DetailRow labelWidth="w-40" label="Year" value={payloadText(payload.year)} /> : null}
        {payload.odometer ? <DetailRow labelWidth="w-40" label="Odometer" value={payloadText(payload.odometer)} /> : null}
      </div>

      <div className="mb-6">
        <h2 className="text-[var(--text-dark-primary)] font-bold mb-2">Service Request</h2>
        <DetailRow labelWidth="w-40" label="Job Types" value={jobTypes} />
        {payload.drop_off_time ? (
          <DetailRow labelWidth="w-40" label="Drop-off Time" value={payloadText(payload.drop_off_time)} />
        ) : null}
        {payload.courtesy_vehicle_requested ? (
          <DetailRow
            labelWidth="w-40"
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

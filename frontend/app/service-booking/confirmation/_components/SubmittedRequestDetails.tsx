import type { ServiceBookingConfirmationState } from '@/types/ServiceBookingConfirmationState';

/**
 * Echoes back what was submitted.
 *
 * The state comes from sessionStorage and is cleared on mount, so a refresh
 * legitimately has nothing to show — hence the fallback message.
 */
export default function SubmittedRequestDetails({ state }: {
  state: ServiceBookingConfirmationState | null;
}) {
  if (!state) {
    return (
      <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg p-4 mb-8">
        <p className="text-sm text-[var(--text-dark-secondary)]">
          Our team will review your request and be in touch shortly to confirm your drop-off time.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg divide-y divide-stone-100 mb-8">
      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
          Your Details
        </p>
        <p className="text-sm text-[var(--text-dark-primary)] font-semibold">
          {state.first_name} {state.last_name}
        </p>
        <p className="text-sm text-[var(--text-dark-secondary)]">{state.email}</p>
        <p className="text-sm text-[var(--text-dark-secondary)]">{state.phone}</p>
      </div>

      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
          Motorcycle
        </p>
        <p className="text-sm text-[var(--text-dark-primary)] font-semibold">
          {[state.year, state.make, state.model].filter(Boolean).join(' ')}
        </p>
        <p className="text-sm text-[var(--text-dark-secondary)]">Rego: {state.registration_number}</p>
      </div>

      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
          Requested Drop-off
        </p>
        <p className="text-sm text-[var(--text-dark-primary)]">{state.drop_off_time}</p>
      </div>

      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
          Services Requested
        </p>
        <ul className="space-y-1">
          {state.job_type_names.map(job => (
            <li key={job} className="text-sm text-[var(--text-dark-primary)]">{job}</li>
          ))}
        </ul>
      </div>

      {state.note && (
        <div className="p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">
            Notes
          </p>
          <p className="text-sm text-[var(--text-dark-secondary)] whitespace-pre-line">{state.note}</p>
        </div>
      )}
    </div>
  );
}

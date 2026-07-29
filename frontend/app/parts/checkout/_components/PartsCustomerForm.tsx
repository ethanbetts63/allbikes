import Link from 'next/link';

import type { CustomerDetails } from '@/app/parts/checkout/_lib/partsCheckoutApi';
import { AUSTRALIAN_STATES } from '@/lib/australianAddresses';
import CheckoutField from './CheckoutField';

/** Name, delivery address and terms for a parts order. */
export default function PartsCustomerForm({ form, submitting, error, onChange, onSubmit }: {
  form: CustomerDetails;
  submitting: boolean;
  error: string | null;
  onChange: (form: CustomerDetails) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const set = (field: keyof CustomerDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({
      ...form,
      [field]: field === 'terms_accepted' ? e.target.checked : e.target.value,
    });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <CheckoutField label="Full name" value={form.customer_name} onChange={set('customer_name')} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <CheckoutField label="Email" type="email" value={form.customer_email} onChange={set('customer_email')} required />
        <CheckoutField label="Phone" value={form.customer_phone} onChange={set('customer_phone')} />
      </div>
      <CheckoutField label="Address line 1" value={form.address_line1} onChange={set('address_line1')} required />
      <CheckoutField label="Address line 2" value={form.address_line2} onChange={set('address_line2')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <CheckoutField label="Suburb" value={form.suburb} onChange={set('suburb')} required />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-black">
            State <span className="text-gray-400">*</span>
          </span>
          <select
            value={form.state}
            onChange={(e) => onChange({ ...form, state: e.target.value })}
            required
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none"
          >
            <option value="" disabled>Select state or territory</option>
            {AUSTRALIAN_STATES.map((state) => (
              <option key={state.value} value={state.value}>{state.label} ({state.value})</option>
            ))}
          </select>
        </label>
      </div>
      <CheckoutField
        label="Postcode"
        value={form.postcode}
        onChange={set('postcode')}
        inputMode="numeric"
        pattern="[0-9]{4}"
        maxLength={4}
        required
      />
      <p className="text-sm text-gray-600">Delivery is currently available within Australia only.</p>

      <label className="flex gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={form.terms_accepted}
          onChange={set('terms_accepted')}
          required
          className="mt-0.5"
        />
        <span>
          I have read and accept the{' '}
          <Link href="/terms?type=parts" target="_blank" className="underline">
            New SYM Parts Terms &amp; Conditions
          </Link>{' '}
          .
        </span>
      </label>

      {error && (
        <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-black">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-black px-6 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-gray-800 disabled:bg-gray-300"
      >
        {submitting ? 'Please wait…' : 'Continue to payment'}
      </button>
    </form>
  );
}

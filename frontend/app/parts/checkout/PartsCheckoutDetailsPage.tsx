'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePartsCart } from '@/context/PartsCartContext';
import CheckoutSteps from '@/components/parts/CheckoutSteps';
import OrderSummary from '@/components/parts/OrderSummary';
import { createPartsOrder, type CustomerDetails } from '@/lib/partsCheckoutApi';
import { stockState } from '@/lib/partsStock';

const STORAGE_KEY = 'parts_checkout_details_v1';

const EMPTY: CustomerDetails = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  address_line1: '',
  address_line2: '',
  suburb: '',
  state: '',
  postcode: '',
  terms_accepted: false,
};

export default function PartsCheckoutDetailsPage() {
  const router = useRouter();
  const { items, subtotal } = usePartsCart();
  const [form, setForm] = useState<CustomerDetails>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setForm({ ...EMPTY, ...JSON.parse(raw), terms_accepted: false });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && items.length === 0) router.replace('/parts/cart');
  }, [hydrated, items.length, router]);

  const set = (field: keyof CustomerDetails) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: field === 'terms_accepted' ? e.target.checked : e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { terms_accepted, ...persistable } = form;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
      const order = await createPartsOrder(form, items);
      router.push(`/parts/checkout/payment?ref=${order.order_reference}&token=${encodeURIComponent(order.access_token)}`);
    } catch (err) {
      const e2 = err as Error & { unavailable?: string[] };
      setError(
        e2.unavailable?.length
          ? `These parts are no longer available: ${e2.unavailable.join(', ')}. Please remove them in your cart.`
          : e2.message || 'Something went wrong. Please try again.',
      );
      setSubmitting(false);
    }
  };

  if (!hydrated || items.length === 0) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-black">Checkout</h1>
      <CheckoutSteps current={1} />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" value={form.customer_name} onChange={set('customer_name')} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" type="email" value={form.customer_email} onChange={set('customer_email')} required />
            <Field label="Phone" value={form.customer_phone} onChange={set('customer_phone')} />
          </div>
          <Field label="Address line 1" value={form.address_line1} onChange={set('address_line1')} required />
          <Field label="Address line 2" value={form.address_line2} onChange={set('address_line2')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Suburb" value={form.suburb} onChange={set('suburb')} required />
            <Field label="State" value={form.state} onChange={set('state')} />
          </div>
          <Field label="Postcode" value={form.postcode} onChange={set('postcode')} required />
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

        <div className="lg:pt-0">
          <OrderSummary
            items={items.map((i) => ({
              part_number: i.part_number,
              description: i.description,
              colour_name: i.colour_name,
              quantity: i.quantity,
              unit_price: i.unit_price,
              backordered: stockState(i.available_qty, i.quantity).kind === 'backorder',
            }))}
            subtotal={subtotal}
            shipping={null}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-black">
        {label}
        {required && <span className="text-gray-400"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none"
      />
    </label>
  );
}

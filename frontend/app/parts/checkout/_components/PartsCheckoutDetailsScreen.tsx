'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { usePartsCart } from '@/context/PartsCartContext';
import CheckoutSteps from '@/components/parts/CheckoutSteps';
import OrderSummary from '@/components/parts/OrderSummary';
import { createPartsOrder, type CustomerDetails } from '@/lib/partsCheckoutApi';
import { australianAddressError } from '@/lib/australianAddresses';
import { stockState } from '@/lib/partsStock';
import PartsCustomerForm from './PartsCustomerForm';
import {
  EMPTY_DETAILS, STORAGE_KEY, persistableDetails, readStoredDetails,
} from '../_lib/checkoutDetails';

export default function PartsCheckoutDetailsScreen() {
  const router = useRouter();
  const { items, subtotal } = usePartsCart();
  const [form, setForm] = useState<CustomerDetails>(EMPTY_DETAILS);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Deferred a tick so the stored values are applied after hydration rather
  // than during it, which would mismatch the server-rendered markup.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = readStoredDetails();
      if (stored) setForm(stored);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (hydrated && items.length === 0) router.replace('/parts/cart');
  }, [hydrated, items.length, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const addressError = australianAddressError(form.state, form.postcode, true);
    if (addressError) {
      setError(addressError);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistableDetails(form)));
      const order = await createPartsOrder(form, items);
      router.push(
        `/parts/checkout/payment?ref=${order.order_reference}&token=${encodeURIComponent(order.access_token)}`,
      );
    } catch (err) {
      const failure = err as Error & { unavailable?: string[] };
      setError(
        failure.unavailable?.length
          ? `These parts are no longer available: ${failure.unavailable.join(', ')}. Please remove them in your cart.`
          : failure.message || 'Something went wrong. Please try again.',
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
        <PartsCustomerForm
          form={form}
          submitting={submitting}
          error={error}
          onChange={setForm}
          onSubmit={submit}
        />

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

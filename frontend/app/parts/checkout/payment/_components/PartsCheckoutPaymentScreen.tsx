'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';

import CheckoutSteps from '@/app/parts/checkout/_components/CheckoutSteps';
import OrderSummary from '@/app/parts/checkout/_components/OrderSummary';
import StripePaymentForm from '@/components/payments/StripePaymentForm';
import { stripePromise } from '@/lib/stripe';
import {
  createPartsPaymentIntent, getPartsOrder, type PartsOrderDetail,
} from '@/app/parts/checkout/_lib/partsCheckoutApi';

export default function PartsCheckoutPaymentScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const accessToken = searchParams.get('token');

  const [order, setOrder] = useState<PartsOrderDetail | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!reference || !accessToken) {
      router.replace('/parts/cart');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const ord = await getPartsOrder(reference, accessToken);
        if (cancelled) return;
        // Already paid — send them to the confirmation rather than charging twice.
        if (ord.status !== 'pending_payment') {
          router.replace(
            `/parts/checkout/confirmation?ref=${reference}&token=${encodeURIComponent(accessToken)}`,
          );
          return;
        }
        const intent = await createPartsPaymentIntent(reference, accessToken);
        if (cancelled) return;
        setOrder(ord);
        setClientSecret(intent.clientSecret);
      } catch {
        if (!cancelled) setError('Unable to prepare payment. Please go back to your cart and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reference, accessToken, router]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-black">Checkout</h1>
      <CheckoutSteps current={2} />

      {loading && <p className="text-gray-600">Preparing payment…</p>}

      {!loading && error && (
        <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-sm text-black">{error}</div>
      )}

      {!loading && order && clientSecret && accessToken && (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            <p className="mb-6 text-sm text-gray-600">
              Order reference:{' '}
              <span className="font-mono font-semibold text-black">{order.order_reference}</span>
            </p>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <StripePaymentForm
                returnUrl={`${window.location.origin}/parts/checkout/confirmation?ref=${order.order_reference}`}
                onSucceeded={() => router.push(
                  `/parts/checkout/confirmation?ref=${order.order_reference}&token=${encodeURIComponent(accessToken)}`,
                )}
                submitLabel="Pay now"
                buttonClassName="w-full rounded-md bg-black px-6 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-gray-800 disabled:bg-gray-300"
                errorClassName="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-black"
              />
            </Elements>
          </div>
          <OrderSummary
            items={order.items}
            subtotal={Number(order.subtotal)}
            shipping={Number(order.shipping)}
            total={Number(order.total)}
          />
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { usePartsCart } from '@/context/PartsCartContext';
import CheckoutSteps from '@/components/parts/CheckoutSteps';
import OrderSummary from '@/components/parts/OrderSummary';
import {
  createPartsPaymentIntent,
  getPartsOrder,
  type PartsOrderDetail,
} from '@/lib/partsCheckoutApi';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm({ reference }: { reference: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clear } = usePartsCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: err, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/parts/checkout/confirmation?ref=${reference}`,
      },
      redirect: 'if_required',
    });

    if (err) {
      setError(err.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded') {
      clear();
      router.push(`/parts/checkout/confirmation?ref=${reference}`);
      return;
    }
    setError('Payment could not be completed. Please try again.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <PaymentElement />
      {error && (
        <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-black">{error}</div>
      )}
      <button
        type="submit"
        disabled={submitting || !stripe || !elements}
        className="w-full rounded-md bg-black px-6 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-gray-800 disabled:bg-gray-300"
      >
        {submitting ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  );
}

export default function PartsCheckoutPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');

  const [order, setOrder] = useState<PartsOrderDetail | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!reference) {
      router.replace('/parts/cart');
      return;
    }
    (async () => {
      try {
        const ord = await getPartsOrder(reference);
        if (ord.status !== 'pending_payment') {
          router.replace(`/parts/checkout/confirmation?ref=${reference}`);
          return;
        }
        const intent = await createPartsPaymentIntent(reference);
        setOrder(ord);
        setClientSecret(intent.clientSecret);
      } catch {
        setError('Unable to prepare payment. Please go back to your cart and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [reference, router]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-black">Checkout</h1>
      <CheckoutSteps current={2} />

      {loading && <p className="text-gray-600">Preparing payment…</p>}

      {!loading && error && (
        <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-sm text-black">{error}</div>
      )}

      {!loading && order && clientSecret && (
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            <p className="mb-6 text-sm text-gray-600">
              Order reference: <span className="font-mono font-semibold text-black">{order.order_reference}</span>
            </p>
            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
              <PaymentForm reference={order.order_reference} />
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

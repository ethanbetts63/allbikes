import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

/**
 * The Stripe form. Must be rendered inside <Elements>.
 *
 * Submit stays disabled until PaymentElement reports ready, so a fast click
 * can't confirm against an element that hasn't mounted its fields yet.
 */
export default function PartsPaymentForm({ reference, accessToken }: {
  reference: string;
  accessToken: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elementReady, setElementReady] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    try {
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
        router.push(
          `/parts/checkout/confirmation?ref=${reference}&token=${encodeURIComponent(accessToken)}`,
        );
        return;
      }
      setError('Payment could not be completed. Please try again.');
      setSubmitting(false);
    } catch {
      setError('Payment could not be completed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <PaymentElement onReady={() => setElementReady(true)} />
      {error && (
        <div className="rounded-md border border-gray-300 bg-gray-50 p-3 text-sm text-black">{error}</div>
      )}
      <button
        type="submit"
        disabled={submitting || !stripe || !elements || !elementReady}
        className="w-full rounded-md bg-black px-6 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-gray-800 disabled:bg-gray-300"
      >
        {submitting ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  );
}

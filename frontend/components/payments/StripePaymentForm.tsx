'use client';

import { useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

const DEFAULT_BUTTON =
  'w-full py-4 px-6 rounded-lg text-base font-bold uppercase tracking-widest transition-colors '
  + 'disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)]';

const DEFAULT_ERROR = 'bg-red-50 border border-red-200 rounded-lg p-4 text-destructive text-sm';

/**
 * The Stripe payment form shared by the checkout, hire and parts flows.
 * Must be rendered inside <Elements>.
 *
 * Submit stays disabled until PaymentElement reports ready. `useElements()`
 * returns the Elements *group*, which exists as soon as Stripe.js resolves —
 * well before the card fields have rendered. Without this gate a fast click
 * confirms against an element that has collected nothing, and Stripe's
 * validation error surfaces to the customer as a payment failure.
 */
export default function StripePaymentForm({
  returnUrl,
  onSucceeded,
  submitLabel = 'Pay Now',
  pendingLabel = 'Processing…',
  buttonClassName = DEFAULT_BUTTON,
  errorClassName = DEFAULT_ERROR,
}: {
  /** Where Stripe sends the customer back after a 3DS redirect. */
  returnUrl: string;
  onSucceeded: () => void;
  submitLabel?: string;
  pendingLabel?: string;
  buttonClassName?: string;
  errorClassName?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [elementReady, setElementReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message ?? 'Payment failed. Please try again.');
        setSubmitting(false);
        return;
      }
      if (paymentIntent?.status === 'succeeded') {
        onSucceeded();
        return;
      }
      if (paymentIntent?.status === 'requires_payment_method') {
        setError('Payment failed. Please check your card details and try again.');
        setSubmitting(false);
        return;
      }
      setError('Payment could not be completed. Please try again.');
      setSubmitting(false);
    } catch {
      // A thrown error would otherwise leave the button stuck on "Processing".
      setError('Payment could not be completed. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement onReady={() => setElementReady(true)} />

      {error && <div className={errorClassName}>{error}</div>}

      <button
        type="submit"
        disabled={submitting || !stripe || !elements || !elementReady}
        className={buttonClassName}
      >
        {submitting ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

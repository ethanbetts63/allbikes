'use client';

import { useEffect, useRef } from 'react';
import { Elements, useStripe } from '@stripe/react-stripe-js';

import { Spinner } from '@/components/ui/spinner';
import { stripePromise } from '@/lib/stripe';

const MAX_POLLS = 15;
const POLL_INTERVAL_MS = 2000; // ~30s total

export interface PaymentProcessingProps {
  /** Order or booking reference from the URL. */
  reference: string | null;
  /** Present only when Stripe redirected back from 3DS. */
  clientSecret: string | null;
  /** Resolves true once our backend has seen the webhook. */
  checkComplete: (reference: string) => Promise<boolean>;
  onComplete: (reference: string) => void;
  /** Polling gave up — the payment may still land, so don't claim failure. */
  onTimeout: (reference: string) => void;
  /** 3DS came back declined; send them to re-enter card details. */
  onDeclined: (reference: string) => void;
  onMissingReference: () => void;
}

/**
 * Waits for the Stripe webhook to mark the order or booking complete.
 *
 * Two entry paths: a card confirmed inline (no client secret in the URL) just
 * polls; a 3DS redirect checks the intent with Stripe first, so a declined
 * card goes straight back to the payment form instead of polling for 30s.
 */
function ProcessingInner(props: PaymentProcessingProps) {
  const stripe = useStripe();
  const {
    reference, clientSecret, checkComplete,
    onComplete, onTimeout, onDeclined, onMissingReference,
  } = props;
  // Guards the 3DS branch, which would otherwise re-run as `stripe` settles.
  const started = useRef(false);

  const startPolling = () => {
    let count = 0;
    const poll = async () => {
      try {
        if (await checkComplete(reference!)) {
          onComplete(reference!);
          return;
        }
      } catch {
        // transient — keep polling
      }
      count += 1;
      if (count >= MAX_POLLS) {
        onTimeout(reference!);
      } else {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };
    poll();
  };

  // Non-3DS path: payment already confirmed inline, just poll the backend.
  useEffect(() => {
    if (clientSecret) return;
    if (!reference) { onMissingReference(); return; }
    startPolling();
  }, []);

  // 3DS redirect path: check Stripe first, then poll the backend.
  useEffect(() => {
    if (!clientSecret || !stripe || !reference) return;
    if (started.current) return;
    started.current = true;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent || paymentIntent.status === 'requires_payment_method') {
        onDeclined(reference);
        return;
      }
      startPolling();
    });
  }, [stripe]);

  return (
    <div className="flex flex-col justify-center items-center h-screen gap-4 bg-[var(--bg-light-primary)]">
      <Spinner className="h-12 w-12" />
      <p className="text-[var(--text-dark-secondary)] text-sm">Confirming your payment&hellip;</p>
    </div>
  );
}

export default function PaymentProcessing(props: PaymentProcessingProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={props.clientSecret ? { clientSecret: props.clientSecret } : undefined}
    >
      <ProcessingInner {...props} />
    </Elements>
  );
}

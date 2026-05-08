"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { createPaymentIntent, getOrderByReference } from '@/api';
import type { Order } from '@/types/Order';
import type { CheckoutItemSummary } from '@/types/CheckoutItemSummary';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// --- Inner form rendered inside <Elements> ---

interface PaymentFormProps {
  orderReference: string;
  slug: string;
  initialError?: string;
}

const PaymentForm = ({ orderReference, slug, initialError }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(initialError ?? null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setPaymentError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/processing?ref=${orderReference}&slug=${slug}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setPaymentError(error.message ?? 'Payment failed. Please try again.');
      setIsSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      router.push(`/checkout/processing?ref=${orderReference}`);
      return;
    }

    if (paymentIntent?.status === 'requires_payment_method') {
      setPaymentError('Payment failed. Please check your card details and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      {paymentError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-destructive text-sm">{paymentError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !stripe || !elements}
        className="w-full py-4 px-6 rounded-lg text-base font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)]"
      >
        {isSubmitting ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

// --- Page wrapper ---

const CheckoutPaymentPage = () => {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderReference = searchParams.get('ref');

  const [itemSummary, setCheckoutItemSummary] = useState<CheckoutItemSummary | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!orderReference) {
      router.push(`/checkout/${slug}`);
      return;
    }

    const loadPayment = async () => {
      try {
        const order: Order = await getOrderByReference(orderReference);
        const paymentIntent = await createPaymentIntent(order.id);
        setClientSecret(paymentIntent.clientSecret);
        setCheckoutItemSummary(buildSummaryFromOrder(order));
      } catch (err) {
        console.error('Failed to prepare checkout payment:', err);
        setLoadError('Unable to prepare payment. Please go back and try again.');
      } finally {
        setIsLoadingSummary(false);
      }
    };

    loadPayment();
  }, [orderReference, router, slug]);

  if (isLoadingSummary) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (loadError || !clientSecret || !orderReference) {
    return (
      <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <p className="text-destructive text-sm mb-4">{loadError || 'Payment could not be loaded.'}</p>
          <button
            type="button"
            onClick={() => router.push(`/checkout/${slug}`)}
            className="py-3 px-6 rounded-lg font-bold uppercase tracking-widest text-sm bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] transition-colors"
          >
            Back to Checkout
          </button>
        </div>
      </div>
    );
  }

  const elementsOptions = {
    clientSecret: clientSecret!,
    appearance: { theme: 'stripe' as const },
  };

  return (
    <>
      <Seo title="Payment | Scooter Shop" noindex={true} />
      <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">

          {/* Item summary */}
          {itemSummary && (
            <div className="bg-[var(--bg-light-secondary)] border border-border-light rounded-lg p-4 mb-8 flex items-center gap-4">
              {itemSummary.imageUrl && (
                <img src={itemSummary.imageUrl} alt={itemSummary.name} className="w-20 h-20 object-cover rounded-md shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                {itemSummary.isDeposit && (
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">Deposit Reservation</p>
                )}
                <p className="font-bold text-[var(--text-dark-primary)] truncate">{itemSummary.name}</p>
                <p className="text-sm text-[var(--text-dark-secondary)]">{itemSummary.priceLabel}</p>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-6">Payment</h1>
          <p className="text-sm text-[var(--text-dark-secondary)] mb-6">
            {itemSummary?.isDeposit ? 'Deposit reference' : 'Order reference'}:{' '}
            <span className="font-mono font-semibold text-[var(--text-dark-primary)]">{orderReference}</span>
          </p>

          <Elements stripe={stripePromise} options={elementsOptions}>
            <PaymentForm orderReference={orderReference!} slug={slug!} initialError={undefined} />
          </Elements>

        </div>
      </div>
    </>
  );
};

function buildSummaryFromOrder(order: Order): CheckoutItemSummary {
  const isDeposit = order.payment_type === 'deposit';
  return {
    name: isDeposit
      ? order.motorcycle_name ?? 'Motorcycle deposit'
      : order.product_name ?? 'E-scooter order',
    imageUrl: null,
    priceLabel: isDeposit ? 'Deposit reservation' : 'Secure online payment',
    isDeposit,
  };
}

export default CheckoutPaymentPage;

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';

import { Spinner } from '@/components/ui/spinner';
import StripePaymentForm from '@/components/payments/StripePaymentForm';
import { stripePromise } from '@/lib/stripe';
import {
  createBikePaymentIntent,
  createProductPaymentIntent,
  getBikeOrder,
  getProductOrder,
} from '@/lib/api';
import type { Order } from '@/types/Order';
import type { CheckoutItemSummary } from '@/app/checkout/[slug]/_lib/CheckoutItemSummary';
import { buildSummaryFromOrder } from '../_lib/checkoutPayment';

export default function CheckoutPaymentScreen() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderReference = searchParams.get('ref');
  const accessToken = searchParams.get('token');
  const orderKind = searchParams.get('kind');

  const [itemSummary, setItemSummary] = useState<CheckoutItemSummary | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!orderReference || !accessToken || (orderKind !== 'product' && orderKind !== 'bike')) {
      router.push(`/checkout/${slug}`);
      return;
    }

    let cancelled = false;
    const loadPayment = async () => {
      try {
        const order: Order = orderKind === 'bike'
          ? await getBikeOrder(orderReference, accessToken)
          : await getProductOrder(orderReference, accessToken);
        const paymentIntent = orderKind === 'bike'
          ? await createBikePaymentIntent(orderReference, accessToken)
          : await createProductPaymentIntent(orderReference, accessToken);
        if (cancelled) return;
        setClientSecret(paymentIntent.clientSecret);
        setItemSummary(buildSummaryFromOrder(order));
      } catch (err) {
        console.error('Failed to prepare checkout payment:', err);
        if (!cancelled) setLoadError('Unable to prepare payment. Please go back and try again.');
      } finally {
        if (!cancelled) setIsLoadingSummary(false);
      }
    };

    loadPayment();
    return () => { cancelled = true; };
  }, [accessToken, orderKind, orderReference, router, slug]);

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

  return (
    <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {itemSummary && (
          <div className="bg-[var(--bg-light-secondary)] border border-border-light rounded-lg p-4 mb-8 flex items-center gap-4">
            {itemSummary.imageUrl && (
              <img
                src={itemSummary.imageUrl}
                alt={itemSummary.name}
                className="w-20 h-20 object-cover rounded-md shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              {itemSummary.isDeposit && (
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">
                  Deposit Reservation
                </p>
              )}
              <p className="font-bold text-[var(--text-dark-primary)] truncate">{itemSummary.name}</p>
              <p className="text-sm text-[var(--text-dark-secondary)]">{itemSummary.priceLabel}</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-6">
          Payment
        </h1>
        <p className="text-sm text-[var(--text-dark-secondary)] mb-6">
          {itemSummary?.isDeposit ? 'Deposit reference' : 'Order reference'}:{' '}
          <span className="font-mono font-semibold text-[var(--text-dark-primary)]">{orderReference}</span>
        </p>

        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <StripePaymentForm
            returnUrl={`${window.location.origin}/checkout/processing?${new URLSearchParams({ ref: orderReference, slug, token: accessToken!, kind: orderKind! }).toString()}`}
            onSucceeded={() => router.push(`/checkout/processing?${new URLSearchParams({ ref: orderReference, slug, token: accessToken!, kind: orderKind! }).toString()}`)}
          />
        </Elements>
      </div>
    </div>
  );
}

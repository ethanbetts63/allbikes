'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { usePartsCart } from '@/context/PartsCartContext';
import CheckoutSteps from '@/components/parts/CheckoutSteps';
import OrderSummary from '@/components/parts/OrderSummary';
import { confirmPartsOrder, type PartsOrderDetail } from '@/lib/partsCheckoutApi';

// How long to keep polling before deciding the order can't be confirmed.
const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15; // ~30s

type Mode = 'confirming' | 'paid' | 'unconfirmed' | 'failed';

export default function PartsCheckoutConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const { clear } = usePartsCart();

  const [mode, setMode] = useState<Mode>('confirming');
  const [order, setOrder] = useState<PartsOrderDetail | null>(null);
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!reference) {
      router.replace('/parts');
      return;
    }
    if (!clearedRef.current) {
      clear();
      clearedRef.current = true;
    }

    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const { state, order: ord } = await confirmPartsOrder(reference);
        if (cancelled) return;
        setOrder(ord);
        if (state === 'paid') {
          setMode('paid');
          return;
        }
        if (state === 'failed') {
          setMode('failed');
          return;
        }
      } catch {
        // network hiccup — treat like pending and keep trying
      }
      if (cancelled) return;
      if (attempts >= MAX_ATTEMPTS) {
        setMode('unconfirmed');
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();
    return () => {
      cancelled = true;
    };
  }, [reference, router, clear]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-black">Checkout</h1>
      <CheckoutSteps current={3} />

      {mode === 'confirming' && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
          <p className="font-medium text-black">Your payment went through — finalising your order…</p>
          <p className="text-sm text-gray-500">This only takes a moment.</p>
        </div>
      )}

      {mode === 'failed' && (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0 text-black" />
            <div>
              <h2 className="text-lg font-bold text-black">Your payment didn&apos;t complete</h2>
              <p className="mt-1 text-sm text-gray-700">
                It looks like the payment wasn&apos;t successful, so no order was placed and you haven&apos;t been
                charged. You can try again from your cart.
              </p>
              <Link
                href="/parts/cart"
                className="mt-4 inline-block rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Back to cart
              </Link>
            </div>
          </div>
        </div>
      )}

      {mode === 'unconfirmed' && order && (
        <div className="space-y-6">
          <div className="rounded-lg border border-amber-400 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0 text-amber-700" />
              <div>
                <h2 className="text-lg font-bold text-amber-900">
                  Payment succeeded — we&apos;re having trouble confirming your order
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  Your payment went through and we have your details — <strong>you don&apos;t need to pay again</strong>.
                  We&apos;re just having trouble finalising the order right now, and our team will make sure it&apos;s
                  processed.
                </p>
                <p className="mt-2 text-sm text-amber-800">
                  Order reference:{' '}
                  <span className="font-mono font-semibold">{order.order_reference}</span> — please quote this if you
                  need to <Link href="/contact" className="underline">get in touch</Link>.
                </p>
              </div>
            </div>
          </div>
          <OrderSummary
            items={order.items}
            subtotal={Number(order.subtotal)}
            shipping={Number(order.shipping)}
            total={Number(order.total)}
          />
        </div>
      )}

      {mode === 'paid' && order && (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-black" />
              <div>
                <h2 className="text-xl font-bold text-black">Payment received — thank you!</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Order reference:{' '}
                  <span className="font-mono font-semibold text-black">{order.order_reference}</span>
                </p>
                <p className="mt-1 text-sm text-gray-600">A confirmation email is on its way.</p>
              </div>
            </div>

            {order.has_backorder && (
              <div className="mt-4 rounded-md border border-gray-300 bg-gray-50 p-4 text-sm text-black">
                <p className="font-semibold">Some items are on backorder</p>
                <p className="mt-1 text-gray-700">
                  Backordered parts (marked in your summary) are held for up to 14 days. If we can&apos;t secure
                  shipment within 14 days, that part is refunded.
                </p>
              </div>
            )}
          </div>

          <OrderSummary
            items={order.items}
            subtotal={Number(order.subtotal)}
            shipping={Number(order.shipping)}
            total={Number(order.total)}
          />

          <div className="flex items-center gap-4">
            <Link
              href="/parts"
              className="inline-block rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-black hover:border-black"
            >
              Back to parts
            </Link>
            <Link href="/refunds" className="text-sm text-gray-600 underline underline-offset-2 hover:text-black">
              Returns &amp; refunds policy
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

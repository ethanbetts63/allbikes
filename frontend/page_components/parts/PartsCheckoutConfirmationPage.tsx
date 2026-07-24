'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { usePartsCart } from '@/context/PartsCartContext';
import CheckoutSteps from '@/components/parts/CheckoutSteps';
import OrderSummary from '@/components/parts/OrderSummary';
import { getPartsOrder, type PartsOrderDetail } from '@/lib/partsCheckoutApi';

const ADMIN_EMAIL = 'admin@scootershop.com.au';
const PAID_STATES = ['paid', 'dispatched', 'partially_refunded', 'refunded'];

export default function PartsCheckoutConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const { clear } = usePartsCart();

  const [order, setOrder] = useState<PartsOrderDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
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

    const tick = async () => {
      attempts += 1;
      try {
        const ord = await getPartsOrder(reference);
        if (cancelled) return;
        setOrder(ord);
        // Keep polling until the webhook marks it paid, so we can drop the
        // "finalising" note — but the page already shows success either way.
        if (!PAID_STATES.includes(ord.status) && attempts < 8) {
          setTimeout(tick, 1500);
        }
      } catch {
        if (cancelled) return;
        if (attempts < 5) {
          setTimeout(tick, 1200);
        } else {
          setNotFound(true);
        }
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [reference, router, clear]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-black">Checkout</h1>
      <CheckoutSteps current={3} />

      {!order && !notFound && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
          <p className="text-gray-600">Finalising your order…</p>
        </div>
      )}

      {notFound && (
        <div className="rounded-md border border-gray-300 bg-gray-50 p-4 text-sm text-black">
          We couldn&apos;t load this order. If you completed payment, email us at{' '}
          <a href={`mailto:${ADMIN_EMAIL}`} className="underline">{ADMIN_EMAIL}</a> quoting reference{' '}
          <span className="font-mono">{reference}</span>.
        </div>
      )}

      {order && (
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
                {!PAID_STATES.includes(order.status) && (
                  <p className="mt-1 text-xs text-gray-500">
                    We&apos;re finalising your order — your confirmation email will follow shortly.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 rounded-md border border-black bg-white p-4 text-sm text-black">
              <p className="font-semibold">One quick step — confirm by email</p>
              <p className="mt-1 text-gray-700">
                Please email{' '}
                <a href={`mailto:${ADMIN_EMAIL}`} className="underline">{ADMIN_EMAIL}</a>{' '}
                from <strong>{order.customer_email}</strong> and quote{' '}
                <span className="font-mono">{order.order_reference}</span> so we can verify your order and confirm
                dispatch.
              </p>
            </div>

            {order.has_backorder && (
              <div className="mt-3 rounded-md border border-gray-300 bg-gray-50 p-4 text-sm text-black">
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

          <Link
            href="/parts"
            className="inline-block rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-black hover:border-black"
          >
            Back to parts
          </Link>
        </div>
      )}
    </div>
  );
}

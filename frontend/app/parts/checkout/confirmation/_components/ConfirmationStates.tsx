import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

import OrderSummary from '@/components/parts/OrderSummary';
import type { PartsOrderDetail } from '@/lib/partsCheckoutApi';

/** Still polling for the webhook. */
export function ConfirmationWaiting() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-black" />
      <p className="font-medium text-black">Confirming your order…</p>
      <p className="text-sm text-gray-500">This usually only takes a few seconds.</p>
    </div>
  );
}

/**
 * Polling ran out. The payment may well have succeeded, so this deliberately
 * avoids saying it failed and gives them the reference to quote.
 */
export function ConfirmationTimeout({ reference, order }: {
  reference: string | null;
  order: PartsOrderDetail | null;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-400 bg-amber-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0 text-amber-700" />
          <div>
            <h2 className="text-lg font-bold text-amber-900">
              We&apos;re having trouble confirming your order
            </h2>
            <p className="mt-1 text-sm text-amber-800">
              This is taking longer than usual. Your order reference is{' '}
              <span className="font-mono font-semibold">{reference}</span> — please{' '}
              <Link href="/contact" className="underline">get in touch</Link> and quote it so we can check on it.
            </p>
          </div>
        </div>
      </div>
      {order && (
        <OrderSummary
          items={order.items}
          subtotal={Number(order.subtotal)}
          shipping={Number(order.shipping)}
          total={Number(order.total)}
        />
      )}
    </div>
  );
}

/** The order reached a terminal failed state; the cart was left intact. */
export function ConfirmationFailed() {
  return (
    <div className="rounded-lg border border-amber-400 bg-amber-50 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-7 w-7 shrink-0 text-amber-700" />
        <div>
          <h2 className="text-lg font-bold text-amber-900">This order was not completed</h2>
          <p className="mt-1 text-sm text-amber-800">
            Your cart has been kept. Return to it to review the parts and try checkout again.
          </p>
          <Link href="/parts/cart" className="mt-3 inline-block text-sm font-medium underline">
            Return to cart
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ConfirmationSuccess({ order }: { order: PartsOrderDetail }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-8 w-8 shrink-0 text-black" />
          <div>
            <h2 className="text-xl font-bold text-black">Order confirmed — thank you!</h2>
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
              Backordered parts (marked in your summary) are held for up to {order.backorder_hold_days} days.
              If we can&apos;t secure shipment within {order.backorder_hold_days} days, that part is refunded.
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
          href="/parts/new/sym"
          className="inline-block rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-black hover:border-black"
        >
          Back to parts
        </Link>
        <Link href="/refunds" className="text-sm text-gray-600 underline underline-offset-2 hover:text-black">
          Returns &amp; refunds policy
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

import { Spinner } from '@/components/ui/spinner';
import { getBikeOrder, getProductOrder } from '@/lib/api';
import type { Order } from '@/types/Order';
import OrderConfirmationDetails from './OrderConfirmationDetails';

export default function CheckoutSuccessScreen() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const token = searchParams.get('token');
  const kind = searchParams.get('kind');
  const hasSecureOrderLink = Boolean(ref && token && (kind === 'product' || kind === 'bike'));
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(hasSecureOrderLink);
  const [error, setError] = useState<string | null>(
    hasSecureOrderLink ? null : 'The secure order link is incomplete.',
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!ref || !token || (kind !== 'product' && kind !== 'bike')) {
      return;
    }

    let cancelled = false;
    const request = kind === 'bike' ? getBikeOrder(ref, token) : getProductOrder(ref, token);
    request
      .then((data) => { if (!cancelled) setOrder(data); })
      .catch(() => { if (!cancelled) setError('Order not found.'); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [kind, ref, token]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (error || !order) {
    return <p className="text-destructive text-center mt-8">{error || 'Order not found.'}</p>;
  }

  const isDeposit = order.order_kind === 'bike';

  return (
    <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <CheckCircle className="h-16 w-16 text-highlight1 mx-auto mb-4" />
          <h1 className="text-3xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
            {isDeposit ? 'Deposit Confirmed' : 'Order Confirmed'}
          </h1>
          <p className="text-[var(--text-dark-secondary)] text-sm">
            A confirmation email will be sent to {order.customer_email}.
          </p>
        </div>

        <div className="bg-[var(--bg-light-secondary)] border border-border-light rounded-lg p-5 mb-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-1">
            {isDeposit ? 'Deposit Reference' : 'Order Reference'}
          </p>
          <p className="text-2xl font-black text-[var(--text-dark-primary)] font-mono tracking-wider">
            {order.order_reference}
          </p>
          <p className="text-xs text-[var(--text-dark-secondary)] mt-1">Keep this for your records</p>
        </div>

        <OrderConfirmationDetails order={order} />

        <Link
          href={isDeposit ? '/inventory/scooters/new' : '/escooters'}
          className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
        >
          {isDeposit ? '← Back to New Scooters' : '← Back to E-Scooters'}
        </Link>
      </div>
    </div>
  );
}

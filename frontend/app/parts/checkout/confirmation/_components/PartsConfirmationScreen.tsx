'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { usePartsCart } from '@/context/PartsCartContext';
import CheckoutSteps from '@/components/parts/CheckoutSteps';
import { getPartsOrder, type PartsOrderDetail } from '@/lib/partsCheckoutApi';
import {
  ConfirmationFailed, ConfirmationSuccess, ConfirmationTimeout, ConfirmationWaiting,
} from './ConfirmationStates';
import {
  type ConfirmationMode, FAILED_STATES, MAX_ATTEMPTS, PAID_STATES, POLL_INTERVAL_MS,
} from '../_lib/confirmationPolling';

export default function PartsConfirmationScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const accessToken = searchParams.get('token');
  const { clear } = usePartsCart();

  const [mode, setMode] = useState<ConfirmationMode>('waiting');
  const [order, setOrder] = useState<PartsOrderDetail | null>(null);
  // The cart must only be emptied once, even though polling can re-enter.
  const clearedRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!reference || !accessToken) {
      router.replace('/parts/new/sym');
      return;
    }
    let cancelled = false;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      attempts += 1;
      try {
        const ord = await getPartsOrder(reference, accessToken);
        if (cancelled) return;
        setOrder(ord);
        if (PAID_STATES.includes(ord.status)) {
          if (!clearedRef.current) {
            clear();
            clearedRef.current = true;
          }
          setMode('confirmed');
          return;
        }
        if (FAILED_STATES.includes(ord.status)) {
          setMode('failed');
          return;
        }
      } catch {
        // transient — keep polling
      }
      if (cancelled) return;
      if (attempts >= MAX_ATTEMPTS) {
        setMode('timeout');
        return;
      }
      timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
    };
    poll();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [reference, accessToken, router, clear]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold text-black">Checkout</h1>
      <CheckoutSteps current={3} />

      {mode === 'waiting' && <ConfirmationWaiting />}
      {mode === 'timeout' && <ConfirmationTimeout reference={reference} order={order} />}
      {mode === 'failed' && <ConfirmationFailed />}
      {mode === 'confirmed' && order && <ConfirmationSuccess order={order} />}
    </div>
  );
}

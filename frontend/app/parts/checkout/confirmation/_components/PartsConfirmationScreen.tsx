'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { usePartsCart } from '@/app/parts/_components/PartsCartContext';
import CheckoutSteps from '@/app/parts/checkout/_components/CheckoutSteps';
import { getCustomerAccessToken } from '@/lib/customerAccess';
import { getPartsOrder, type PartsOrderDetail } from '@/app/parts/checkout/_lib/partsCheckoutApi';
import { SYM_PARTS_PATH } from '@/app/parts/_lib/routes';
import {
  ConfirmationFailed, ConfirmationSuccess, ConfirmationTimeout, ConfirmationWaiting,
} from './ConfirmationStates';

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15;
const PAID_STATES = ['paid', 'dispatched', 'completed', 'partially_refunded', 'refunded'];
const FAILED_STATES = ['cancelled'];

type ConfirmationMode = 'waiting' | 'confirmed' | 'failed' | 'timeout';

export default function PartsConfirmationScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const { clear } = usePartsCart();

  const [mode, setMode] = useState<ConfirmationMode>('waiting');
  const [order, setOrder] = useState<PartsOrderDetail | null>(null);
  // The cart must only be emptied once, even though polling can re-enter.
  const clearedRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!reference) {
      router.replace(SYM_PARTS_PATH);
      return;
    }
    const accessToken = getCustomerAccessToken('parts', reference);
    if (!accessToken) {
      router.replace(SYM_PARTS_PATH);
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
  }, [reference, router, clear]);

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

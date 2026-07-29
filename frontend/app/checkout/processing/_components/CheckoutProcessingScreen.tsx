'use client';

import { useSearchParams, useRouter } from 'next/navigation';

import PaymentProcessing from '@/components/payments/PaymentProcessing';
import { getCustomerAccessToken } from '@/lib/customerAccess';
import { getBikeOrder, getProductOrder } from '@/lib/api';

export default function CheckoutProcessingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const kind = searchParams.get('kind');
  const context = new URLSearchParams({
    ...(slug ? { slug } : {}),
    ...(kind ? { kind } : {}),
  }).toString();

  return (
    <PaymentProcessing
      reference={searchParams.get('ref')}
      clientSecret={searchParams.get('payment_intent_client_secret')}
      checkComplete={async (ref) => {
        if (kind !== 'product' && kind !== 'bike') return false;
        const token = getCustomerAccessToken(kind, ref);
        if (!token) return false;
        const order = kind === 'bike' ? await getBikeOrder(ref, token) : await getProductOrder(ref, token);
        return order.status === 'paid';
      }}
      onComplete={(ref) => router.push(`/checkout/success?ref=${ref}&${context}`)}
      onTimeout={(ref) => router.push(`/checkout/error?ref=${ref}&${context}`)}
      onDeclined={(ref) => router.push(`/checkout/${slug}/payment?ref=${ref}&${context}`)}
      onMissingReference={() => router.push('/')}
    />
  );
}

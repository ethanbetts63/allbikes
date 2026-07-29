'use client';

import { useSearchParams, useRouter } from 'next/navigation';

import PaymentProcessing from '@/components/payments/PaymentProcessing';
import { getOrderByReference } from '@/api';

export default function CheckoutProcessingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  return (
    <PaymentProcessing
      reference={searchParams.get('ref')}
      clientSecret={searchParams.get('payment_intent_client_secret')}
      checkComplete={async (ref) => (await getOrderByReference(ref)).status === 'paid'}
      onComplete={(ref) => router.push(`/checkout/success?ref=${ref}`)}
      onTimeout={(ref) => router.push(`/checkout/error?ref=${ref}`)}
      onDeclined={(ref) => router.push(`/checkout/${slug}/payment?ref=${ref}`)}
      onMissingReference={() => router.push('/')}
    />
  );
}

'use client';

import { useSearchParams, useRouter } from 'next/navigation';

import PaymentProcessing from '@/components/payments/PaymentProcessing';
import { getHireBookingByReference } from '@/lib/api';
import { getCustomerAccessToken } from '@/lib/customerAccess';

export default function HireProcessingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <PaymentProcessing
      reference={searchParams.get('ref')}
      clientSecret={searchParams.get('payment_intent_client_secret')}
      checkComplete={async (ref) => {
        const token = getCustomerAccessToken('hire', ref);
        if (!token) return false;
        return (await getHireBookingByReference(ref, token)).status === 'confirmed';
      }}
      onComplete={(ref) => router.push(`/hire/confirmation/${ref}`)}
      onTimeout={() => router.push('/hire')}
      onDeclined={(ref) => router.push(`/hire/book/${ref}/payment`)}
      onMissingReference={() => router.push('/hire')}
    />
  );
}

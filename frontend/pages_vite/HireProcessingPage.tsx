"use client";

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe } from '@stripe/react-stripe-js';
import { Spinner } from '@/components/ui/spinner';
import { getHireBookingByReference } from '@/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const MAX_POLLS = 15;
const POLL_INTERVAL_MS = 2000;

const ProcessingInner = () => {
    const stripe = useStripe();
    const router = useRouter();
    const searchParams = useSearchParams();
    const started = useRef(false);

    const clientSecret = searchParams.get('payment_intent_client_secret');
    const ref = searchParams.get('ref');

    const startPolling = () => {
        let count = 0;
        const poll = async () => {
            try {
                const booking = await getHireBookingByReference(ref!);
                if (booking.status === 'confirmed') {
                    router.push(`/hire/confirmation/${ref}`);
                    return;
                }
            } catch {
                // ignore errors, keep polling
            }
            count += 1;
            if (count >= MAX_POLLS) {
                router.push('/hire');
            } else {
                setTimeout(poll, POLL_INTERVAL_MS);
            }
        };
        poll();
    };

    // Non-3DS path: payment already confirmed inline, just poll backend
    useEffect(() => {
        if (clientSecret) return;
        if (!ref) { router.push('/hire'); return; }
        startPolling();
    }, []);

    // 3DS redirect path: check Stripe first, then poll backend
    useEffect(() => {
        if (!clientSecret || !stripe || !ref) return;
        if (started.current) return;
        started.current = true;

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            if (!paymentIntent || paymentIntent.status === 'requires_payment_method') {
                router.push(`/hire/book/${ref}/payment`);
                return;
            }
            startPolling();
        });
    }, [stripe]);

    return (
        <div className="flex flex-col justify-center items-center h-screen gap-4 bg-[var(--bg-light-primary)]">
            <Spinner className="h-12 w-12" />
            <p className="text-[var(--text-dark-secondary)] text-sm">Confirming your payment&hellip;</p>
        </div>
    );
};

const HireProcessingPage = () => {
    const searchParams = useSearchParams();
    const clientSecret = searchParams.get('payment_intent_client_secret') ?? undefined;

    return (
        <>
            <Elements stripe={stripePromise} options={clientSecret ? { clientSecret } : undefined}>
                <ProcessingInner />
            </Elements>
        </>
    );
};

export default HireProcessingPage;

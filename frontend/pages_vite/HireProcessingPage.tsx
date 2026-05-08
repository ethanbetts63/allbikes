import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe } from '@stripe/react-stripe-js';
import { Spinner } from '@/components/ui/spinner';
import Seo from '@/components/Seo';
import { getHireBookingByReference } from '@/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const MAX_POLLS = 15;
const POLL_INTERVAL_MS = 2000;

const ProcessingInner = () => {
    const stripe = useStripe();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const started = useRef(false);

    const clientSecret = searchParams.get('payment_intent_client_secret');
    const ref = searchParams.get('ref');

    const startPolling = () => {
        let count = 0;
        const poll = async () => {
            try {
                const booking = await getHireBookingByReference(ref!);
                if (booking.status === 'confirmed') {
                    navigate(`/hire/confirmation/${ref}`, { state: booking });
                    return;
                }
            } catch {
                // ignore errors, keep polling
            }
            count += 1;
            if (count >= MAX_POLLS) {
                navigate('/hire');
            } else {
                setTimeout(poll, POLL_INTERVAL_MS);
            }
        };
        poll();
    };

    // Non-3DS path: payment already confirmed inline, just poll backend
    useEffect(() => {
        if (clientSecret) return;
        if (!ref) { navigate('/hire'); return; }
        startPolling();
    }, []);

    // 3DS redirect path: check Stripe first, then poll backend
    useEffect(() => {
        if (!clientSecret || !stripe || !ref) return;
        if (started.current) return;
        started.current = true;

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            if (!paymentIntent || paymentIntent.status === 'requires_payment_method') {
                navigate(`/hire/book/${ref}/payment`, {
                    state: { clientSecret, bookingReference: ref, error: 'Payment failed. Please try again.' },
                });
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
    const [searchParams] = useSearchParams();
    const clientSecret = searchParams.get('payment_intent_client_secret') ?? undefined;

    return (
        <>
            <Seo title="Processing | ScooterShop" noindex={true} />
            <Elements stripe={stripePromise} options={clientSecret ? { clientSecret } : undefined}>
                <ProcessingInner />
            </Elements>
        </>
    );
};

export default HireProcessingPage;

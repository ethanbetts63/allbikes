"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Seo from '@/components/Seo';
import { CalendarDays } from 'lucide-react';
import { formatDate } from '@/lib/hire';
import type { HireBookingSummary } from '@/types/HireBookingSummary';
import { createHirePaymentIntent, getHireBookingByReference } from '@/api';
import { Spinner } from '@/components/ui/spinner';
import type { HireBooking } from '@/types/HireBooking';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// --- Inner form rendered inside <Elements> ---

interface PaymentFormProps {
    bookingReference: string;
    initialError?: string;
}

const PaymentForm = ({ bookingReference, initialError }: PaymentFormProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(initialError ?? null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsSubmitting(true);
        setPaymentError(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/hire/processing?ref=${bookingReference}`,
            },
            redirect: 'if_required',
        });

        if (error) {
            setPaymentError(error.message ?? 'Payment failed. Please try again.');
            setIsSubmitting(false);
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            router.push(`/hire/processing?ref=${bookingReference}`);
            return;
        }

        if (paymentIntent?.status === 'requires_payment_method') {
            setPaymentError('Payment failed. Please check your card details and try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />

            {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-destructive text-sm">{paymentError}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting || !stripe || !elements}
                className="w-full py-4 px-6 rounded-lg text-base font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)]"
            >
                {isSubmitting ? 'Processing...' : 'Pay Now'}
            </button>
        </form>
    );
};

// --- Page wrapper ---

const HirePaymentPage = () => {
    const router = useRouter();
    const params = useParams<{ bookingReference: string }>();
    const bookingReference = params.bookingReference;
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [summary, setSummary] = useState<HireBookingSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!bookingReference) {
            router.push('/hire');
            return;
        }

        const loadPayment = async () => {
            try {
                const booking = await getHireBookingByReference(bookingReference);
                const paymentIntent = await createHirePaymentIntent(booking.id);
                setClientSecret(paymentIntent.clientSecret);
                setSummary(buildSummaryFromBooking(booking));
            } catch (err) {
                console.error('Failed to prepare hire payment:', err);
                setLoadError('Unable to prepare payment. Please go back and try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadPayment();
    }, [bookingReference, router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (loadError || !clientSecret || !bookingReference) {
        return (
            <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
                <div className="container mx-auto px-4 py-8 max-w-2xl">
                    <p className="text-destructive text-sm mb-4">{loadError || 'Payment could not be loaded.'}</p>
                    <button
                        type="button"
                        onClick={() => router.push('/hire')}
                        className="py-3 px-6 rounded-lg font-bold uppercase tracking-widest text-sm bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)] transition-colors"
                    >
                        Back to Hire
                    </button>
                </div>
            </div>
        );
    }

    const bondAmount = summary ? parseFloat(summary.bondAmount) : 0;
    const extrasTotal = summary ? parseFloat(summary.extrasTotal) : 0;
    const totalCharge = summary ? parseFloat(summary.totalCharged).toFixed(2) : '0.00';

    const elementsOptions = {
        clientSecret: clientSecret!,
        appearance: { theme: 'stripe' as const },
    };

    return (
        <>
            <Seo title="Payment | ScooterShop" noindex={true} />
            <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
                <div className="container mx-auto px-4 py-8 max-w-2xl">

                    {/* Booking summary */}
                    {summary && (
                        <div className="bg-[var(--bg-light-secondary)] border border-[var(--border-light)] rounded-lg p-4 mb-8">
                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-1">
                                Hire Booking
                            </p>
                            <p className="font-bold text-[var(--text-dark-primary)] text-base mb-2">{summary.motorcycleName}</p>
                            <div className="flex items-center gap-2 text-[var(--text-dark-secondary)] mb-3">
                                <CalendarDays className="h-4 w-4 shrink-0" />
                                <span className="text-sm">{formatDate(summary.hireStart)} — {formatDate(summary.hireEnd)}</span>
                            </div>
                            <div className="border-t border-[var(--border-light)] pt-3 space-y-1.5 text-sm">
                                <div className="flex justify-between text-[var(--text-dark-secondary)]">
                                    <span>Hire total ({summary.numDays} {summary.numDays === 1 ? 'day' : 'days'})</span>
                                    <span>${parseFloat(summary.totalHireAmount).toFixed(2)}</span>
                                </div>
                                {extrasTotal > 0 && (
                                    <div className="flex justify-between text-[var(--text-dark-secondary)]">
                                        <span>Extras</span>
                                        <span>${extrasTotal.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-[var(--text-dark-primary)] border-t border-[var(--border-light)] pt-2">
                                    <span>Total charged today</span>
                                    <span>${totalCharge}</span>
                                </div>
                                {bondAmount > 0 && (
                                    <div className="flex justify-between text-[var(--text-dark-secondary)] text-xs pt-1">
                                        <span>Bond due at pickup (in-store)</span>
                                        <span>${bondAmount.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">Payment</h1>
                    <p className="text-sm text-[var(--text-dark-secondary)] mb-6">
                        Booking reference:{' '}
                        <span className="font-mono font-semibold text-[var(--text-dark-primary)]">{bookingReference}</span>
                    </p>

                    <Elements stripe={stripePromise} options={elementsOptions}>
                        <PaymentForm
                            bookingReference={bookingReference!}
                            initialError={undefined}
                        />
                    </Elements>

                </div>
            </div>
        </>
    );
};

function buildSummaryFromBooking(booking: HireBooking): HireBookingSummary {
    return {
        motorcycleName: booking.motorcycle_name,
        hireStart: booking.hire_start,
        hireEnd: booking.hire_end,
        numDays: booking.num_days,
        totalHireAmount: booking.total_hire_amount,
        bondAmount: booking.bond_amount,
        extrasTotal: booking.extras
            .reduce((total, extra) => total + parseFloat(extra.total_amount), 0)
            .toFixed(2),
        totalCharged: booking.total_charged,
    };
}

export default HirePaymentPage;

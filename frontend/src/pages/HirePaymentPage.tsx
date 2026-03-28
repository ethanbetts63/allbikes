import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { CalendarDays } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface BookingSummary {
    motorcycleName: string;
    hireStart: string;
    hireEnd: string;
    numDays: number;
    totalHireAmount: string;
    bondAmount: string;
}

interface LocationState {
    clientSecret: string;
    bookingReference: string;
    bookingSummary?: BookingSummary;
    error?: string;
}

const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

// --- Inner form rendered inside <Elements> ---

interface PaymentFormProps {
    bookingReference: string;
    initialError?: string;
}

const PaymentForm = ({ bookingReference, initialError }: PaymentFormProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
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
            navigate(`/hire/processing?ref=${bookingReference}`);
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
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState | null;

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!state?.clientSecret || !state?.bookingReference) {
            navigate('/hire');
        }
    }, []);

    if (!state?.clientSecret) return null;

    const summary = state.bookingSummary;
    const bondAmount = summary ? parseFloat(summary.bondAmount) : 0;
    const totalCharge = summary
        ? (parseFloat(summary.totalHireAmount) + bondAmount).toFixed(2)
        : null;

    const elementsOptions = {
        clientSecret: state.clientSecret,
        appearance: { theme: 'stripe' as const },
    };

    return (
        <>
            <Seo title="Payment | Allbikes Hire" noindex={true} />
            <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
                <div className="container mx-auto px-4 py-8 max-w-2xl">

                    {/* Booking summary */}
                    {summary && (
                        <div className="bg-[var(--bg-light-secondary)] border border-[var(--border-light)] rounded-lg p-4 mb-8 space-y-3 text-sm">
                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]">
                                Hire Booking
                            </p>
                            <p className="font-bold text-[var(--text-dark-primary)] text-base">{summary.motorcycleName}</p>
                            <div className="flex items-center gap-2 text-[var(--text-dark-secondary)]">
                                <CalendarDays className="h-4 w-4 shrink-0" />
                                <span>{formatDate(summary.hireStart)} — {formatDate(summary.hireEnd)}</span>
                            </div>
                            <div className="border-t border-[var(--border-light)] pt-3 space-y-1.5">
                                <div className="flex justify-between text-[var(--text-dark-secondary)]">
                                    <span>Hire total ({summary.numDays} {summary.numDays === 1 ? 'day' : 'days'})</span>
                                    <span>${parseFloat(summary.totalHireAmount).toFixed(2)}</span>
                                </div>
                                {bondAmount > 0 && (
                                    <div className="flex justify-between text-[var(--text-dark-secondary)]">
                                        <span>Bond (refundable)</span>
                                        <span>${bondAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-[var(--text-dark-primary)] border-t border-[var(--border-light)] pt-2">
                                    <span>Total charged today</span>
                                    <span>${totalCharge}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">Payment</h1>
                    <p className="text-sm text-[var(--text-dark-secondary)] mb-6">
                        Booking reference:{' '}
                        <span className="font-mono font-semibold text-[var(--text-dark-primary)]">{state.bookingReference}</span>
                    </p>

                    <Elements stripe={stripePromise} options={elementsOptions}>
                        <PaymentForm
                            bookingReference={state.bookingReference}
                            initialError={state.error}
                        />
                    </Elements>

                </div>
            </div>
        </>
    );
};

export default HirePaymentPage;

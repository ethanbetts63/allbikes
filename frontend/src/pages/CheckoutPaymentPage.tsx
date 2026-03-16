import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { getOrderByReference } from '@/api';
import type { Order } from '@/types/Order';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface ItemSummary {
  name: string;
  imageUrl: string | null;
  priceLabel: string;
  isDeposit: boolean;
}

interface LocationState {
  clientSecret: string;
  orderReference: string;
  itemSummary?: ItemSummary;
  error?: string;
}

// --- Inner form rendered inside <Elements> ---

interface PaymentFormProps {
  orderReference: string;
  slug: string;
  initialError?: string;
}

const PaymentForm = ({ orderReference, slug, initialError }: PaymentFormProps) => {
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
        return_url: `${window.location.origin}/checkout/processing?ref=${orderReference}&slug=${slug}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setPaymentError(error.message ?? 'Payment failed. Please try again.');
      setIsSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      navigate(`/checkout/processing?ref=${orderReference}`);
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

const CheckoutPaymentPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [itemSummary, setItemSummary] = useState<ItemSummary | null>(state?.itemSummary ?? null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(!state?.itemSummary);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!state?.clientSecret || !state?.orderReference) {
      navigate(`/checkout/${slug}`);
      return;
    }
    // If itemSummary wasn't passed (e.g. 3DS recovery from processing page), fetch order to build it
    if (!state.itemSummary && state.orderReference) {
      getOrderByReference(state.orderReference)
        .then((order: Order) => {
          setItemSummary({
            name: order.motorcycle_name ?? order.product_name ?? '',
            imageUrl: null,
            priceLabel: order.payment_type === 'deposit'
              ? `$${parseFloat(order.amount_paid ?? '0').toLocaleString()} deposit`
              : `$${parseFloat(order.amount_paid ?? '0').toLocaleString()} incl. GST`,
            isDeposit: order.payment_type === 'deposit',
          });
        })
        .catch(() => {/* summary is optional, payment still works */})
        .finally(() => setIsLoadingSummary(false));
    } else {
      setIsLoadingSummary(false);
    }
  }, []);

  if (!state?.clientSecret) return null;

  if (isLoadingSummary) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  const elementsOptions = {
    clientSecret: state.clientSecret,
    appearance: { theme: 'stripe' as const },
  };

  return (
    <>
      <Seo title="Payment | Scooter Shop" noindex={true} />
      <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">

          {/* Item summary */}
          {itemSummary && (
            <div className="bg-[var(--bg-light-secondary)] border border-border-light rounded-lg p-4 mb-8 flex items-center gap-4">
              {itemSummary.imageUrl && (
                <img src={itemSummary.imageUrl} alt={itemSummary.name} className="w-20 h-20 object-cover rounded-md shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                {itemSummary.isDeposit && (
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">Deposit Reservation</p>
                )}
                <p className="font-bold text-[var(--text-dark-primary)] truncate">{itemSummary.name}</p>
                <p className="text-sm text-[var(--text-dark-secondary)]">{itemSummary.priceLabel}</p>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-6">Payment</h1>
          <p className="text-sm text-[var(--text-dark-secondary)] mb-6">
            {itemSummary?.isDeposit ? 'Deposit reference' : 'Order reference'}:{' '}
            <span className="font-mono font-semibold text-[var(--text-dark-primary)]">{state.orderReference}</span>
          </p>

          <Elements stripe={stripePromise} options={elementsOptions}>
            <PaymentForm orderReference={state.orderReference} slug={slug!} initialError={state.error} />
          </Elements>

        </div>
      </div>
    </>
  );
};

export default CheckoutPaymentPage;

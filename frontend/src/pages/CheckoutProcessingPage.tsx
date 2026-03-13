import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe } from '@stripe/react-stripe-js';
import { Spinner } from '@/components/ui/spinner';
import Seo from '@/components/Seo';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const MAX_POLLS = 15;
const POLL_INTERVAL_MS = 2000;

const ProcessingInner = () => {
  const stripe = useStripe();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pollCount = useRef(0);

  const clientSecret = searchParams.get('payment_intent_client_secret');
  const ref = searchParams.get('ref');
  const slug = searchParams.get('slug');

  useEffect(() => {
    if (!stripe || !clientSecret) return;

    const check = async () => {
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

      if (!paymentIntent) {
        navigate(`/checkout/success?ref=${ref}`);
        return;
      }

      switch (paymentIntent.status) {
        case 'succeeded':
          navigate(`/checkout/success?ref=${ref}`);
          break;

        case 'requires_payment_method':
          navigate(`/checkout/${slug}/payment`, {
            state: { clientSecret, orderReference: ref, error: 'Payment failed. Please try again.' },
          });
          break;

        case 'processing':
          pollCount.current += 1;
          if (pollCount.current >= MAX_POLLS) {
            // Timed out — send to success anyway (webhook will sort it out)
            navigate(`/checkout/success?ref=${ref}`);
          } else {
            setTimeout(check, POLL_INTERVAL_MS);
          }
          break;

        default:
          navigate(`/checkout/success?ref=${ref}`);
      }
    };

    check();
  }, [stripe]);

  return (
    <div className="flex flex-col justify-center items-center h-screen gap-4 bg-white">
      <Spinner className="h-12 w-12" />
      <p className="text-stone-600 text-sm">Confirming your payment&hellip;</p>
    </div>
  );
};

const CheckoutProcessingPage = () => {
  const [searchParams] = useSearchParams();
  const clientSecret = searchParams.get('payment_intent_client_secret') ?? undefined;

  return (
    <>
      <Seo title="Processing | Scooter Shop" noindex={true} />
      <Elements stripe={stripePromise} options={clientSecret ? { clientSecret } : undefined}>
        <ProcessingInner />
      </Elements>
    </>
  );
};

export default CheckoutProcessingPage;

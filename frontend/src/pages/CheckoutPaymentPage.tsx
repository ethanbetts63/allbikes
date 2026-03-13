import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { getProductById } from '@/api';
import type { Product } from '@/types/Product';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface LocationState {
  clientSecret: string;
  orderReference: string;
}

// --- Inner form rendered inside <Elements> ---

interface PaymentFormProps {
  orderReference: string;
  productSlug: string;
}

const PaymentForm = ({ orderReference, productSlug }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setPaymentError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/processing?ref=${orderReference}&slug=${productSlug}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setPaymentError(error.message ?? 'Payment failed. Please try again.');
      setIsSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      navigate(`/checkout/success?ref=${orderReference}`);
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
          <p className="text-red-600 text-sm">{paymentError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !stripe || !elements}
        className="w-full py-4 px-6 rounded-lg text-base font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-amber-400 hover:bg-amber-500 text-stone-900"
      >
        {isSubmitting ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

// --- Page wrapper ---

const CheckoutPaymentPage = () => {
  const { productSlug } = useParams<{ productSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

  const productId = productSlug ? Number(productSlug.split('-').pop()) : null;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!state?.clientSecret || !state?.orderReference) {
      navigate(`/checkout/${productSlug}`);
      return;
    }
    if (!productId || isNaN(productId)) {
      navigate('/escooters');
      return;
    }
    getProductById(productId)
      .then(setProduct)
      .catch(() => navigate('/escooters'))
      .finally(() => setIsLoadingProduct(false));
  }, []);

  if (!state?.clientSecret) return null;

  if (isLoadingProduct) {
    return (
      <div className="flex justify-center items-center h-screen bg-white">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  const displayPrice = product?.discount_price && parseFloat(product.discount_price) > 0
    ? product.discount_price
    : product?.price ?? '0';

  const sortedImages = product ? [...product.images].sort((a, b) => a.order - b.order) : [];
  const imageUrl = sortedImages[0]?.thumbnail || sortedImages[0]?.image;

  const elementsOptions = {
    clientSecret: state.clientSecret,
    appearance: { theme: 'stripe' as const },
  };

  return (
    <>
      <Seo title="Payment | Scooter Shop" noindex={true} />
      <div className="bg-white text-stone-900 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">

          {/* Product summary */}
          {product && (
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-8 flex items-center gap-4">
              {imageUrl && (
                <img src={imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded-md shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                {product.brand && (
                  <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-0.5">{product.brand}</p>
                )}
                <p className="font-bold text-stone-900 truncate">{product.name}</p>
                <p className="text-sm text-stone-600">
                  ${parseFloat(displayPrice).toLocaleString()} incl. GST &middot; Free delivery Australia-wide
                </p>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-black text-stone-900 uppercase tracking-wide mb-6">Payment</h1>
          <p className="text-sm text-stone-500 mb-6">Order reference: <span className="font-mono font-semibold text-stone-900">{state.orderReference}</span></p>

          <Elements stripe={stripePromise} options={elementsOptions}>
            <PaymentForm orderReference={state.orderReference} productSlug={productSlug!} />
          </Elements>

        </div>
      </div>
    </>
  );
};

export default CheckoutPaymentPage;

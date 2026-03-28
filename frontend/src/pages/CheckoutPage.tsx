import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getProductById, getBikeById, getDepositSettings, createOrder, createPaymentIntent, getLatestTermsAndConditions } from '@/api';
import type { Product } from '@/types/Product';
import type { Bike } from '@/types/Bike';

interface CheckoutFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  address_line1: string;
  address_line2: string;
  suburb: string;
  state: string;
  postcode: string;
}

interface LocationState {
  checkoutType?: 'product' | 'deposit';
}

interface ItemSummary {
  name: string;
  imageUrl: string | null;
  priceLabel: string;
  isDeposit: boolean;
}

const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'];

const CheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const checkoutType = locationState?.checkoutType ?? 'product';

  const [product, setProduct] = useState<Product | null>(null);
  const [bike, setBike] = useState<Bike | null>(null);
  const [depositAmount, setDepositAmount] = useState<string | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsUrl, setTermsUrl] = useState<string | null>(null);

  const productId = slug ? Number(slug.split('-').pop()) : null;

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>();

  useEffect(() => {
    window.scrollTo(0, 0);

    getLatestTermsAndConditions('purchase')
      .then(terms => setTermsUrl(`/terms?type=purchase`))
      .catch(() => {});

    if (checkoutType === 'deposit') {
      if (!slug) { navigate('/inventory/motorcycles/new'); return; }
      const bikeId = slug.split('-').pop();
      if (!bikeId) { navigate('/inventory/motorcycles/new'); return; }
      Promise.all([getBikeById(bikeId), getDepositSettings()])
        .then(([bikeData, settings]) => {
          if (bikeData.status !== 'for_sale' || (bikeData.condition !== 'new' && bikeData.condition !== 'demo')) {
            navigate(`/inventory/motorcycles/${slug}`);
            return;
          }
          setBike(bikeData);
          setDepositAmount(settings.deposit_amount);
        })
        .catch(() => navigate('/inventory/motorcycles/new'))
        .finally(() => setIsLoadingItem(false));
    } else {
      if (!productId || isNaN(productId)) { navigate('/escooters'); return; }
      getProductById(productId)
        .then(data => {
          if (!data.in_stock) { navigate(`/escooters/${slug}`); return; }
          setProduct(data);
        })
        .catch(() => navigate('/escooters'))
        .finally(() => setIsLoadingItem(false));
    }
  }, []);

  const buildItemSummary = (): ItemSummary => {
    if (checkoutType === 'deposit' && bike && depositAmount) {
      const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
      return {
        name: bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`,
        imageUrl: sortedImages[0]?.image ?? null,
        priceLabel: `$${parseFloat(depositAmount).toLocaleString()} deposit`,
        isDeposit: true,
      };
    }
    if (product) {
      const sortedImages = [...product.images].sort((a, b) => a.order - b.order);
      const price = product.discount_price && parseFloat(product.discount_price) > 0
        ? product.discount_price
        : product.price;
      return {
        name: product.name,
        imageUrl: sortedImages[0]?.thumbnail ?? sortedImages[0]?.image ?? null,
        priceLabel: `$${parseFloat(price).toLocaleString()} incl. GST · Free delivery Australia-wide`,
        isDeposit: false,
      };
    }
    return { name: '', imageUrl: null, priceLabel: '', isDeposit: false };
  };

  const onSubmit = async (formData: CheckoutFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const orderPayload =
        checkoutType === 'deposit' && bike
          ? { motorcycle: bike.id, payment_type: 'deposit' as const, ...formData, terms_accepted: true }
          : { product: product!.id, ...formData, terms_accepted: true };

      const order = await createOrder(orderPayload);
      const { clientSecret } = await createPaymentIntent(order.order_id);

      navigate(`/checkout/${slug}/payment`, {
        state: {
          clientSecret,
          orderReference: order.order_reference,
          itemSummary: buildItemSummary(),
        },
      });
    } catch (err: any) {
      if (err?.status === 409) {
        setSubmitError(
          checkoutType === 'deposit'
            ? 'Sorry, this motorcycle has just been reserved. Please contact us for availability.'
            : 'Sorry, this product just sold out. Please go back and choose another.'
        );
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingItem) {
    return (
      <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  if (checkoutType === 'deposit' && !bike) return null;
  if (checkoutType === 'product' && !product) return null;

  const summary = buildItemSummary();

  return (
    <>
      <Seo title="Checkout | Scooter Shop" noindex={true} />
      <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">

          {/* Item summary */}
          <div className="bg-[var(--bg-light-secondary)] border border-border-light rounded-lg p-4 mb-8 flex items-center gap-4">
            {summary.imageUrl && (
              <img src={summary.imageUrl} alt={summary.name} className="w-20 h-20 object-cover rounded-md shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              {checkoutType === 'deposit' && (
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">Deposit Reservation</p>
              )}
              {checkoutType === 'product' && product?.brand && (
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">{product.brand}</p>
              )}
              <p className="font-bold text-[var(--text-dark-primary)] truncate">{summary.name}</p>
              <p className="text-sm text-[var(--text-dark-secondary)]">{summary.priceLabel}</p>
            </div>
          </div>

          <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-6">Your Details</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="customer_name">Full Name *</Label>
                <Input
                  id="customer_name"
                  {...register('customer_name', { required: 'Full name is required.' })}
                  placeholder="Jane Smith"
                />
                {errors.customer_name && <p className="text-destructive text-sm">{errors.customer_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer_email">Email Address *</Label>
                <Input
                  id="customer_email"
                  type="email"
                  {...register('customer_email', {
                    required: 'Email is required.',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' },
                  })}
                  placeholder="jane@example.com"
                />
                {errors.customer_email && <p className="text-destructive text-sm">{errors.customer_email.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customer_phone">
                Phone Number {checkoutType === 'deposit' ? '*' : ''}
              </Label>
              <Input
                id="customer_phone"
                type="tel"
                {...register('customer_phone', checkoutType === 'deposit'
                  ? { required: 'Phone number is required so we can contact you about pickup.' }
                  : {}
                )}
                placeholder={checkoutType === 'deposit' ? '0400 000 000' : '0400 000 000 (optional)'}
              />
              {errors.customer_phone && <p className="text-destructive text-sm">{errors.customer_phone.message}</p>}
            </div>

            {checkoutType === 'product' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="address_line1">Address Line 1 *</Label>
                  <Input
                    id="address_line1"
                    {...register('address_line1', { required: 'Address is required.' })}
                    placeholder="123 Example Street"
                  />
                  {errors.address_line1 && <p className="text-destructive text-sm">{errors.address_line1.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    {...register('address_line2')}
                    placeholder="Unit, apartment, etc. (optional)"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="col-span-2 sm:col-span-1 space-y-1.5">
                    <Label htmlFor="suburb">Suburb *</Label>
                    <Input
                      id="suburb"
                      {...register('suburb', { required: 'Suburb is required.' })}
                      placeholder="Dianella"
                    />
                    {errors.suburb && <p className="text-destructive text-sm">{errors.suburb.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State *</Label>
                    <select
                      id="state"
                      {...register('state', { required: 'State is required.' })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Select</option>
                      {AU_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.state && <p className="text-destructive text-sm">{errors.state.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input
                      id="postcode"
                      {...register('postcode', {
                        required: 'Postcode is required.',
                        pattern: { value: /^\d{4}$/, message: 'Enter a 4-digit postcode.' },
                      })}
                      placeholder="6059"
                      maxLength={4}
                    />
                    {errors.postcode && <p className="text-destructive text-sm">{errors.postcode.message}</p>}
                  </div>
                </div>
              </>
            )}

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-destructive text-sm">{submitError}</p>
              </div>
            )}

            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="terms_accepted"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                className="mt-0.5"
              />
              <Label htmlFor="terms_accepted" className="text-sm leading-snug cursor-pointer">
                I have read and agree to the{' '}
                <a href="/terms?type=purchase" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">
                  Terms and Conditions
                </a>
                .
              </Label>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || !termsAccepted}
                className="w-full py-4 px-6 rounded-lg text-base font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)]"
              >
                {isSubmitting ? 'Please wait...' : 'Continue to Payment'}
              </button>
              <div className="text-sm text-[var(--text-dark-secondary)] space-y-1">
                {checkoutType === 'deposit' ? (
                  <p>✓ Secure your motorcycle with a ${depositAmount && parseFloat(depositAmount).toLocaleString()} deposit — our team will be in touch</p>
                ) : (
                  <>
                    <p>✓ Free delivery Australia-wide</p>
                    <p>✓ Order confirmation sent to your email</p>
                  </>
                )}
              </div>
            </div>

          </form>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;

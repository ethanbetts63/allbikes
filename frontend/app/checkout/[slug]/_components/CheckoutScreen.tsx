'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { Spinner } from '@/components/ui/spinner';
import { createBikeOrder, createProductOrder, getProductById, getBikeById, getDepositSettings } from '@/lib/api';
import { storeCustomerAccessToken } from '@/lib/customerAccess';
import type { Product } from '@/types/Product';
import type { Bike } from '@/types/Bike';
import type { CheckoutFormData } from '@/app/checkout/[slug]/_lib/CheckoutFormData';
import CheckoutForm from './CheckoutForm';
import CheckoutItemCard from './CheckoutItemCard';
import { type CheckoutType, buildItemSummary } from '../_lib/checkout';

export default function CheckoutScreen() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutType = (searchParams.get('type') ?? 'product') as CheckoutType;
  const requestedColour = searchParams.get('colour');

  const [product, setProduct] = useState<Product | null>(null);
  const [bike, setBike] = useState<Bike | null>(null);
  const [depositAmount, setDepositAmount] = useState<string | null>(null);
  const [selectedColour, setSelectedColour] = useState<string | null>(null);
  const [isLoadingItem, setIsLoadingItem] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const productId = slug ? Number(slug.split('-').pop()) : null;

  useEffect(() => {
    window.scrollTo(0, 0);

    if (checkoutType === 'deposit') {
      if (!slug) { router.push('/inventory/scooters/new'); return; }
      const bikeId = slug.split('-').pop();
      if (!bikeId) { router.push('/inventory/scooters/new'); return; }
      Promise.all([getBikeById(bikeId), getDepositSettings()])
        .then(([bikeData, settings]) => {
          if (
            bikeData.status !== 'for_sale'
            || (bikeData.condition !== 'new' && bikeData.condition !== 'demo' && bikeData.condition !== 'used')
          ) {
            router.push(`/inventory/motorcycles/${slug}`);
            return;
          }
          const availableColours = bikeData.available_colours ?? [];
          if (availableColours.length > 0) {
            const colour = availableColours.find(
              (availableColour) =>
                availableColour.toLocaleLowerCase() === requestedColour?.toLocaleLowerCase(),
            );
            if (!colour) {
              router.push(`/inventory/motorcycles/${slug}`);
              return;
            }
            setSelectedColour(colour);
          } else if (requestedColour) {
            router.push(`/inventory/motorcycles/${slug}`);
            return;
          }
          setBike(bikeData);
          setDepositAmount(settings.deposit_amount);
        })
        .catch(() => router.push('/inventory/scooters/new'))
        .finally(() => setIsLoadingItem(false));
    } else {
      if (!productId || isNaN(productId)) { router.push('/escooters'); return; }
      getProductById(productId)
        .then(data => {
          if (!data.in_stock) { router.push(`/escooters/${slug}`); return; }
          setProduct(data);
        })
        .catch(() => router.push('/escooters'))
        .finally(() => setIsLoadingItem(false));
    }
  }, [checkoutType, productId, requestedColour, router, slug]);

  const onSubmit = async (formData: CheckoutFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const order = checkoutType === 'deposit' && bike
        ? await createBikeOrder({
            motorcycle: bike.id,
            selected_colour: selectedColour ?? '',
            customer_name: formData.customer_name,
            customer_email: formData.customer_email,
            customer_phone: formData.customer_phone,
            terms_accepted: true,
          })
        : await createProductOrder({ product: product!.id, ...formData, terms_accepted: true });

      storeCustomerAccessToken(order.order_kind, order.order_reference, order.access_token);
      const query = new URLSearchParams({
        ref: order.order_reference,
        kind: order.order_kind,
      });
      router.push(`/checkout/${slug}/payment?${query.toString()}`);
    } catch (err: unknown) {
      const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined;
      if (status === 409) {
        setSubmitError(
          checkoutType === 'deposit'
            ? 'Sorry, this motorcycle has just been reserved. Please contact us for availability.'
            : 'Sorry, this product just sold out. Please go back and choose another.',
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

  // The effect redirects in these cases; render nothing while it happens.
  if (checkoutType === 'deposit' && !bike) return null;
  if (checkoutType === 'product' && !product) return null;

  const summary = buildItemSummary({ checkoutType, bike, product, depositAmount });

  return (
    <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <CheckoutItemCard
          summary={summary}
          checkoutType={checkoutType}
          brand={product?.brand}
          selectedColour={selectedColour}
        />

        <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-6">
          Your Details
        </h1>

        <CheckoutForm
          checkoutType={checkoutType}
          depositAmount={depositAmount}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

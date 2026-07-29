import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { CheckoutFormData } from '@/app/checkout/[slug]/_lib/CheckoutFormData';
import DeliveryAddressFields from './DeliveryAddressFields';
import type { CheckoutType } from '../_lib/checkout';

/**
 * Customer details and consents.
 *
 * A deposit needs a phone number and the warranty acknowledgement; a product
 * order needs a delivery address instead.
 */
export default function CheckoutForm({
  checkoutType, depositAmount, isSubmitting, submitError, onSubmit,
}: {
  checkoutType: CheckoutType;
  depositAmount: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (data: CheckoutFormData) => void;
}) {
  const { register, getValues, handleSubmit, formState: { errors } } = useForm<CheckoutFormData>();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [warrantyAccepted, setWarrantyAccepted] = useState(false);

  const isDeposit = checkoutType === 'deposit';
  const canSubmit = termsAccepted && (!isDeposit || warrantyAccepted);

  return (
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
        <Label htmlFor="customer_phone">Phone Number {isDeposit ? '*' : ''}</Label>
        <Input
          id="customer_phone"
          type="tel"
          {...register('customer_phone', isDeposit
            ? { required: 'Phone number is required so we can contact you about pickup.' }
            : {})}
          placeholder={isDeposit ? '0400 000 000' : '0400 000 000 (optional)'}
        />
        {errors.customer_phone && <p className="text-destructive text-sm">{errors.customer_phone.message}</p>}
      </div>

      {!isDeposit && <DeliveryAddressFields register={register} getValues={getValues} errors={errors} />}

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
          <span>
            I have read and agree to the{' '}
            <a href="/terms?type=purchase" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">
              Terms and Conditions
            </a>.
          </span>
        </Label>
      </div>

      {isDeposit && (
        <div className="flex items-start gap-3">
          <Checkbox
            id="warranty_accepted"
            checked={warrantyAccepted}
            onCheckedChange={(checked) => setWarrantyAccepted(!!checked)}
            className="mt-0.5"
          />
          <Label htmlFor="warranty_accepted" className="text-sm leading-snug cursor-pointer">
            <span>
              I understand the{' '}
              <a href="https://scoota.com.au/warranty/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">
                warranty
              </a>{' '}
              and live in Western Australia.
            </span>
          </Label>
        </div>
      )}

      <div className="pt-2 space-y-3">
        <button
          type="submit"
          disabled={isSubmitting || !canSubmit}
          className="w-full py-4 px-6 rounded-lg text-base font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)]"
        >
          {isSubmitting ? 'Please wait...' : 'Continue to Payment'}
        </button>
        <div className="text-sm text-[var(--text-dark-secondary)] space-y-1">
          {isDeposit ? (
            <p>
              ✓ Secure your motorcycle with a ${depositAmount && parseFloat(depositAmount).toLocaleString()} deposit
              {' '}— our team will be in touch
            </p>
          ) : (
            <>
              <p>✓ Free delivery Australia-wide</p>
              <p>✓ Order confirmation sent to your email</p>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

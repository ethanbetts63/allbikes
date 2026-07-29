import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { HireBookingFormData } from '@/types/HireBookingFormData';

/**
 * Customer details plus the three consents.
 *
 * Every consent is required before submit unlocks — the bond one only appears
 * when a bond is actually charged.
 */
export default function HireCustomerForm({
  minimumAge, bondAmount, isSubmitting, submitError, onSubmit,
}: {
  minimumAge: number;
  /** Null or zero means no bond is taken, so no acknowledgement is asked for. */
  bondAmount: number | null;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (data: HireBookingFormData) => void;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<HireBookingFormData>();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isOfAge, setIsOfAge] = useState(false);
  const [bondAcknowledged, setBondAcknowledged] = useState(false);

  const bondRequired = bondAmount !== null && bondAmount > 0;
  const canSubmit = termsAccepted && isOfAge && (!bondRequired || bondAcknowledged);

  return (
    <>
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-4">
        Your Details
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="customer_name">Full Name *</Label>
          <Input
            id="customer_name"
            placeholder="Jane Smith"
            {...register('customer_name', { required: 'Name is required' })}
          />
          {errors.customer_name && <p className="text-destructive text-sm">{errors.customer_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="customer_email">Email Address *</Label>
          <Input
            id="customer_email"
            type="email"
            placeholder="jane@example.com"
            {...register('customer_email', {
              required: 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
            })}
          />
          {errors.customer_email && <p className="text-destructive text-sm">{errors.customer_email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="customer_phone">Phone Number *</Label>
          <Input
            id="customer_phone"
            type="tel"
            placeholder="0400 000 000"
            {...register('customer_phone', { required: 'Phone number is required' })}
          />
          {errors.customer_phone && <p className="text-destructive text-sm">{errors.customer_phone.message}</p>}
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-destructive text-sm">{submitError}</p>
          </div>
        )}

        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="hire_terms_accepted"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(!!checked)}
            className="mt-0.5"
          />
          <Label htmlFor="hire_terms_accepted" className="text-sm leading-snug cursor-pointer">
            <span>
              I have read and agree to the{' '}
              <a href="/terms?type=hire" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">
                Hire Terms and Conditions
              </a>.
            </span>
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="hire_is_of_age"
            checked={isOfAge}
            onCheckedChange={(checked) => setIsOfAge(!!checked)}
            className="mt-0.5"
          />
          <Label htmlFor="hire_is_of_age" className="text-sm leading-snug cursor-pointer">
            <span>I confirm that I am {minimumAge} years of age or older.</span>
          </Label>
        </div>

        {bondRequired && (
          <div className="flex items-start gap-3">
            <Checkbox
              id="hire_bond_acknowledged"
              checked={bondAcknowledged}
              onCheckedChange={(checked) => setBondAcknowledged(!!checked)}
              className="mt-0.5"
            />
            <Label htmlFor="hire_bond_acknowledged" className="text-sm leading-snug cursor-pointer">
              I acknowledge a ${bondAmount.toFixed(2)} refundable bond is payable at pickup.
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
        </div>
      </form>
    </>
  );
}

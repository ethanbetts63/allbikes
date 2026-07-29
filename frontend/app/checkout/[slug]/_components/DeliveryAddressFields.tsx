import type { FieldErrors, UseFormGetValues, UseFormRegister } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CheckoutFormData } from '@/types/CheckoutFormData';
import { AUSTRALIAN_STATES, postcodeMatchesState } from '@/lib/australianAddresses';

/** Shipping address. Only product orders are delivered, so deposits skip this. */
export default function DeliveryAddressFields({ register, getValues, errors }: {
  register: UseFormRegister<CheckoutFormData>;
  getValues: UseFormGetValues<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
}) {
  return (
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
        <Input id="address_line2" {...register('address_line2')} placeholder="Unit, apartment, etc. (optional)" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label htmlFor="suburb">Suburb *</Label>
          <Input id="suburb" {...register('suburb', { required: 'Suburb is required.' })} placeholder="Dianella" />
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
            {AUSTRALIAN_STATES.map(state => (
              <option key={state.value} value={state.value}>{state.label} ({state.value})</option>
            ))}
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
              validate: value => postcodeMatchesState(value, getValues('state'))
                || `Postcode ${value} does not match ${getValues('state')}.`,
            })}
            placeholder="6059"
            inputMode="numeric"
            maxLength={4}
          />
          {errors.postcode && <p className="text-destructive text-sm">{errors.postcode.message}</p>}
        </div>
      </div>
    </>
  );
}

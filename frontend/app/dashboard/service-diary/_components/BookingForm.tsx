"use client";

import type { BookingInput, BookingStatus } from '@/types/Booking';
import { BOOKING_STATUSES } from '@/app/dashboard/service-diary/_lib/bookingStatus';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AUSTRALIAN_STATES } from '@/lib/australianAddresses';

interface BookingFormProps {
  value: BookingInput;
  onChange: (value: BookingInput) => void;
  showStatus?: boolean;
}

const BookingForm = ({ value, onChange, showStatus = true }: BookingFormProps) => {
  const set = <K extends keyof BookingInput>(key: K, v: BookingInput[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-6">
      {/* Schedule */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="drop_off_date">Drop-off date *</Label>
          <Input
            id="drop_off_date"
            type="date"
            value={value.drop_off_date}
            onChange={e => set('drop_off_date', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="drop_off_time">Drop-off time</Label>
          <Input
            id="drop_off_time"
            type="time"
            value={value.drop_off_time ?? ''}
            onChange={e => set('drop_off_time', e.target.value || null)}
          />
        </div>
      </div>

      {showStatus && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={value.status ?? 'accepted'}
            onChange={e => set('status', e.target.value as BookingStatus)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {BOOKING_STATUSES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Vehicle */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="registration">Registration</Label>
          <Input
            id="registration"
            value={value.registration ?? ''}
            onChange={e => set('registration', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input
            id="make"
            placeholder="e.g. Vespa"
            value={value.make ?? ''}
            onChange={e => set('make', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            placeholder="e.g. GTS 300"
            value={value.model ?? ''}
            onChange={e => set('model', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            placeholder="e.g. 2016"
            value={value.year ?? ''}
            onChange={e => set('year', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="odometer">Odometer</Label>
          <Input
            id="odometer"
            placeholder="e.g. 12000"
            value={value.odometer ?? ''}
            onChange={e => set('odometer', e.target.value)}
          />
        </div>
      </div>

      {/* Customer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer_name">Customer name *</Label>
          <Input
            id="customer_name"
            value={value.customer_name}
            onChange={e => set('customer_name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer_phone">Phone</Label>
          <Input
            id="customer_phone"
            value={value.customer_phone ?? ''}
            onChange={e => set('customer_phone', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer_email">Email</Label>
          <Input
            id="customer_email"
            type="email"
            value={value.customer_email ?? ''}
            onChange={e => set('customer_email', e.target.value)}
          />
        </div>
      </div>

      {/* Address (optional) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="street_address">Street address</Label>
          <Input
            id="street_address"
            placeholder="Optional"
            value={value.street_address ?? ''}
            onChange={e => set('street_address', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="suburb">Suburb</Label>
          <Input
            id="suburb"
            placeholder="Optional"
            value={value.suburb ?? ''}
            onChange={e => set('suburb', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <select
            id="state"
            value={value.state ?? ''}
            onChange={e => set('state', e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Optional</option>
            {AUSTRALIAN_STATES.map(state => (
              <option key={state.value} value={state.value}>{state.value}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input
            id="postcode"
            placeholder="Optional"
            value={value.postcode ?? ''}
            onChange={e => set('postcode', e.target.value)}
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
          />
        </div>
      </div>

      {/* Job */}
      <div className="space-y-2">
        <Label htmlFor="job_description">Job description</Label>
        <Textarea
          id="job_description"
          rows={4}
          value={value.job_description ?? ''}
          onChange={e => set('job_description', e.target.value)}
        />
      </div>
    </div>
  );
};

export default BookingForm;

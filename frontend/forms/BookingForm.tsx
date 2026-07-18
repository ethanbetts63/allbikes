"use client";

import type { BookingInput, BookingStatus } from '@/types/Booking';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'requested', label: 'Requested' },
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'finished_paid', label: 'Finished & paid' },
];

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
            value={value.status ?? 'not_started'}
            onChange={e => set('status', e.target.value as BookingStatus)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Vehicle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bike_name">Bike (make / model)</Label>
          <Input
            id="bike_name"
            placeholder="e.g. Vespa GTS 300"
            value={value.bike_name ?? ''}
            onChange={e => set('bike_name', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="registration">Registration</Label>
          <Input
            id="registration"
            value={value.registration ?? ''}
            onChange={e => set('registration', e.target.value)}
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

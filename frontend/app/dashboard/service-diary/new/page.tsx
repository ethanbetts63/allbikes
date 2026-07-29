'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { adminCreateBooking } from '@/api';
import type { BookingInput } from '@/types/Booking';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BackToDiaryLink from '../_components/BackToDiaryLink';
import BookingFormCard from '../_components/BookingFormCard';
import { bookingValidationError, canSaveBooking, diaryWeekHref, emptyBooking } from '../_lib/diary';

export default function AddBookingPage() {
  const router = useRouter();
  const [value, setValue] = useState<BookingInput>(emptyBooking);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = canSaveBooking(value);

  const handleSave = async () => {
    const validationError = bookingValidationError(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await adminCreateBooking(value);
      // Land on the week the job was booked into, not whichever week is current.
      router.push(diaryWeekHref(created.drop_off_date));
    } catch {
      setError('Failed to create booking.');
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <BackToDiaryLink />

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <BookingFormCard
        title="Add Booking"
        value={value}
        onChange={setValue}
        footerRight={
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving ? 'Saving…' : 'Create Booking'}
          </Button>
        }
      />
    </div>
  );
}

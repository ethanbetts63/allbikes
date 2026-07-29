import type { BookingInput } from '@/types/Booking';
import BookingForm from '@/app/dashboard/service-diary/_components/BookingForm';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Card shell around the shared BookingForm.
 *
 * `headerExtra` and `footerLeft` are what differ between adding and editing —
 * the source badge and the delete button respectively.
 */
export default function BookingFormCard({
  title, value, headerExtra, footerLeft, footerRight, onChange,
}: {
  title: string;
  value: BookingInput;
  headerExtra?: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight: React.ReactNode;
  onChange: (value: BookingInput) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {headerExtra}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <BookingForm value={value} onChange={onChange} />
      </CardContent>
      <CardFooter className={footerLeft ? 'flex items-center justify-between' : 'flex justify-end'}>
        {footerLeft}
        {footerRight}
      </CardFooter>
    </Card>
  );
}

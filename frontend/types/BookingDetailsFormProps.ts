import type React from 'react';
import type { BookingFormData } from './BookingFormData';

export interface BookingDetailsFormProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  nextStep: () => void;
}

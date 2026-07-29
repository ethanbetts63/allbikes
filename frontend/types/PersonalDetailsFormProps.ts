import type React from 'react';
import type { BookingFormData } from './BookingFormData';

export interface PersonalDetailsFormProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  prevStep: () => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

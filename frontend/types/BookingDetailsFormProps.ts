import type React from 'react';

export interface BookingDetailsFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  nextStep: () => void;
}

import type React from 'react';

export interface PersonalDetailsFormProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  prevStep: () => void;
  handleSubmit: () => void;
  error: string | null;
}

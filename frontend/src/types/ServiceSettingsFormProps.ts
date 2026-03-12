import type React from 'react';
import type { ServiceSettings } from './ServiceSettings';

export interface ServiceSettingsFormProps {
  settings: ServiceSettings;
  loading: boolean;
  successMessage: string | null;
  handleSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

import type { SubmitHandler } from 'react-hook-form';
import type { Bike } from './Bike';
import type { MotorcycleFormData } from './MotorcycleFormData';

export interface MotorcycleFormProps {
  initialData?: Bike;
  onSubmit: SubmitHandler<MotorcycleFormData>;
  isLoading?: boolean;
}

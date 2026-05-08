import type { Bike } from './Bike';
import type { ManagedImage } from './ManagedImage';

export type MotorcycleFormData = Omit<Bike, 'id' | 'images'> & {
  managedImages: ManagedImage[];
};

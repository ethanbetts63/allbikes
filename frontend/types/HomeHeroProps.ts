import type { Bike } from './Bike';

export interface HomeHeroProps {
  newBikes: Bike[];
  usedBikes: Bike[];
  error: string | null;
  phoneNumber?: string;
  mobileNumber?: string;
  emailAddress?: string;
}

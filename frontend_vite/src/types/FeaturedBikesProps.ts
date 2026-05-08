import type React from 'react';
import type { Bike } from './Bike';

export interface FeaturedBikesProps {
  title: React.ReactNode;
  bikes: Bike[];
  description: string;
  linkTo: string;
  linkText: string;
}

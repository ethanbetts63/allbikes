import type { Bike } from '@/types/Bike';

export interface BikeListPageProps {
  bikeCondition: 'new,demo' | 'used' | 'parts';
  initialBikes?: Bike[];
  initialTotalPages?: number;
}

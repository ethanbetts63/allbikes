import type { Bike } from '@/types/Bike';
import type { FilterSortOptions } from '@/types/FilterSortOptions';

export interface BikeListPageProps {
  bikeCondition: 'new,demo' | 'used' | 'parts';
  pageType?: 'new' | 'used-motorcycles' | 'used-scooters' | 'parts';
  bikes: Bike[];
  totalPages: number;
  currentPage: number;
  filters: FilterSortOptions;
}

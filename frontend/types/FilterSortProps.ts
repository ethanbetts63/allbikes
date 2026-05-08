import type { FilterSortOptions } from './FilterSortOptions';

export interface FilterSortProps {
  options: FilterSortOptions;
  onFilterChange: (newOptions: FilterSortOptions) => void;
}

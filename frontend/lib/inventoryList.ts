import type { Bike } from '@/types/Bike';
import { getServerBikes } from '@/lib/serverApi';
import { buildBikeListQuery, type ListSearchParams } from '@/lib/listQuery';
import type { FilterSortOptions } from '@/types/FilterSortOptions';
import { INVENTORY_PAGE_SIZE } from '@/config/siteSettings';

export interface InitialBikeList {
  bikes: Bike[];
  totalPages: number;
  currentPage: number;
  filters: FilterSortOptions;
}

export async function getInitialBikeList(condition: string, searchParams: ListSearchParams = {}): Promise<InitialBikeList> {
  const query = buildBikeListQuery(condition, searchParams);

  try {
    const response = await getServerBikes(query.params);
    return {
      bikes: response.results,
      totalPages: Math.ceil(response.count / INVENTORY_PAGE_SIZE),
      currentPage: query.page,
      filters: query.filters,
    };
  } catch (error) {
    console.error(`Failed to server-render ${condition} bike list:`, error);
    return {
      bikes: [],
      totalPages: 0,
      currentPage: query.page,
      filters: query.filters,
    };
  }
}

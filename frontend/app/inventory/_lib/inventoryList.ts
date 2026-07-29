import type { Bike } from '@/types/Bike';
import { getServerBikeMakes, getServerBikes } from '@/lib/serverApi';
import { buildBikeListQuery, type ListSearchParams } from '@/lib/listQuery';
import type { FilterSortOptions } from '@/types/FilterSortOptions';
import { INVENTORY_PAGE_SIZE } from '@/lib/siteSettings';

interface InitialBikeList {
  bikes: Bike[];
  totalPages: number;
  currentPage: number;
  filters: FilterSortOptions;
  makes: string[];
}

export async function getInitialBikeList(
  condition: string,
  searchParams: ListSearchParams = {},
  fixedParams: Record<string, string> = {}
): Promise<InitialBikeList> {
  const query = buildBikeListQuery(condition, searchParams, fixedParams);
  const makeParams = new URLSearchParams({ condition, ...fixedParams });

  try {
    const [response, makes] = await Promise.all([
      getServerBikes(query.params),
      getServerBikeMakes(makeParams),
    ]);
    return {
      bikes: response.results,
      totalPages: Math.ceil(response.count / INVENTORY_PAGE_SIZE),
      currentPage: query.page,
      filters: query.filters,
      makes,
    };
  } catch (error) {
    console.error(`Failed to server-render ${condition} bike list:`, error);
    return {
      bikes: [],
      totalPages: 0,
      currentPage: query.page,
      filters: query.filters,
      makes: [],
    };
  }
}

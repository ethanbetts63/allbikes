import type { Product } from '@/types/Product';
import { getServerProducts } from '@/lib/serverApi';
import { buildProductListQuery, type ListSearchParams } from '@/lib/listQuery';
import type { FilterSortOptions } from '@/types/FilterSortOptions';

export interface InitialProductList {
  products: Product[];
  totalPages: number;
  currentPage: number;
  filters: FilterSortOptions;
}

export async function getInitialProductList(searchParams: ListSearchParams = {}): Promise<InitialProductList> {
  const query = buildProductListQuery(searchParams);

  try {
    const response = await getServerProducts(query.params);
    return {
      products: response.results,
      totalPages: Math.ceil(response.count / 12),
      currentPage: query.page,
      filters: query.filters,
    };
  } catch (error) {
    console.error('Failed to server-render e-scooter list:', error);
    return {
      products: [],
      totalPages: 0,
      currentPage: query.page,
      filters: query.filters,
    };
  }
}

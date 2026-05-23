import type { FilterSortOptions } from '@/types/FilterSortOptions';

export type ListSearchParams = Record<string, string | string[] | undefined>;

const BIKE_FILTER_KEYS = [
  'ordering',
  'min_price',
  'max_price',
  'min_year',
  'max_year',
  'min_engine_size',
  'max_engine_size',
] as const;

const PRODUCT_FILTER_KEYS = [
  'ordering',
  'min_price',
  'max_price',
] as const;

type ListFilterKey = typeof BIKE_FILTER_KEYS[number] | typeof PRODUCT_FILTER_KEYS[number];

export interface ListQueryState {
  page: number;
  filters: FilterSortOptions;
  params: URLSearchParams;
}

export function buildBikeListQuery(
  condition: string,
  searchParams: ListSearchParams = {},
  fixedParams: Record<string, string> = {}
): ListQueryState {
  return buildListQuery(searchParams, BIKE_FILTER_KEYS, { condition, ...fixedParams });
}

export function buildProductListQuery(searchParams: ListSearchParams = {}): ListQueryState {
  return buildListQuery(searchParams, PRODUCT_FILTER_KEYS);
}

export function buildListHref(
  basePath: string,
  filters: FilterSortOptions,
  page: number
): string {
  const params = new URLSearchParams();

  appendFilterParams(params, filters);
  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function buildListQuery(
  searchParams: ListSearchParams,
  allowedFilterKeys: readonly ListFilterKey[],
  fixedParams: Record<string, string> = {}
): ListQueryState {
  const page = parsePositiveInteger(firstParam(searchParams.page)) ?? 1;
  const filters: FilterSortOptions = {};
  const params = new URLSearchParams({
    ...fixedParams,
    page: String(page),
  });

  for (const key of allowedFilterKeys) {
    const value = firstParam(searchParams[key]);
    if (!value) continue;

    if (key === 'ordering') {
      filters.ordering = value;
      params.set(key, value);
      continue;
    }

    const numberValue = parsePositiveInteger(value);
    if (numberValue === undefined) continue;

    filters[key] = numberValue;
    params.set(key, String(numberValue));
  }

  return { page, filters, params };
}

function appendFilterParams(params: URLSearchParams, filters: FilterSortOptions) {
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return undefined;

  return parsed;
}

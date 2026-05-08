import type { Bike } from '@/types/Bike';
import type { PaginatedResponse } from '@/types/PaginatedResponse';
import type { Product } from '@/types/Product';

const API_BASE_URL = process.env.DJANGO_API_URL ?? 'http://localhost:8000';
const REVALIDATE_SECONDS = 300;

export async function getServerBikes(params: URLSearchParams): Promise<PaginatedResponse<Bike>> {
  return fetchServerJson<PaginatedResponse<Bike>>(`/api/inventory/bikes/?${params.toString()}`);
}

export async function getServerProducts(params: URLSearchParams): Promise<PaginatedResponse<Product>> {
  const query = params.toString();
  return fetchServerJson<PaginatedResponse<Product>>(`/api/product/products/${query ? `?${query}` : ''}`);
}

async function fetchServerJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Server API request failed (${response.status}) for ${path}`);
  }

  return response.json() as Promise<T>;
}

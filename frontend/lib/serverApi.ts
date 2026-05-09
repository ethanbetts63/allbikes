import type { Bike } from '@/types/Bike';
import type { PaginatedResponse } from '@/types/PaginatedResponse';
import type { Product } from '@/types/Product';
import type { TermsAndConditions } from '@/types/TermsAndConditions';

const API_BASE_URL = process.env.DJANGO_API_URL ?? 'http://localhost:8000';
const REVALIDATE_SECONDS = 300;

export async function getServerBikes(params: URLSearchParams): Promise<PaginatedResponse<Bike>> {
  return fetchServerJson<PaginatedResponse<Bike>>(`/api/inventory/bikes/?${params.toString()}`);
}

export async function getServerBikeById(id: string): Promise<Bike> {
  return fetchServerJson<Bike>(`/api/inventory/bikes/${id}/`);
}

export async function getServerProducts(params: URLSearchParams): Promise<PaginatedResponse<Product>> {
  const query = params.toString();
  return fetchServerJson<PaginatedResponse<Product>>(`/api/product/products/${query ? `?${query}` : ''}`);
}

export async function getServerProductById(id: number): Promise<Product> {
  return fetchServerJson<Product>(`/api/product/products/${id}/`);
}

export async function getServerHireBikes(startDate?: string, endDate?: string): Promise<Bike[]> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  const query = params.toString();
  return fetchServerJson<Bike[]>(`/api/hire/bikes/${query ? `?${query}` : ''}`);
}

export async function getServerDepositSettings(): Promise<{ deposit_amount: string }> {
  return fetchServerJson<{ deposit_amount: string }>('/api/payments/deposit-settings/');
}

export async function getServerLatestTermsAndConditions(type?: 'hire' | 'service' | 'purchase'): Promise<TermsAndConditions> {
  const path = type ? `/api/data/terms/latest/?type=${type}` : '/api/data/terms/latest/';
  return fetchServerJson<TermsAndConditions>(path);
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

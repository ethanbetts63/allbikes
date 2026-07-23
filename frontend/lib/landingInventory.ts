import 'server-only';

import { getServerBikes } from '@/lib/serverApi';
import type { Bike } from '@/types/Bike';
import type { GetBikesOptions } from '@/types/GetBikesOptions';

const ACTIVE_STATUSES = new Set<Bike['status']>(['for_sale', 'reserved', 'available_soon']);

export async function fetchLandingBikes(options: GetBikesOptions): Promise<Bike[]> {
  const params = new URLSearchParams();

  Object.entries({ page: 1, page_size: 100, ...options }).forEach(([key, value]) => {
    if (value !== undefined) params.set(key, String(value));
  });

  try {
    const response = await getServerBikes(params);
    return response.results.filter((bike) => bike.status !== 'unavailable');
  } catch (error) {
    console.error(`Failed to fetch landing-page inventory (${params.toString()}):`, error);
    return [];
  }
}

export function activeLandingBikes(bikes: Bike[]): Bike[] {
  return bikes.filter((bike) => ACTIVE_STATUSES.has(bike.status));
}

export function prioritizeLandingBikes(targetBikes: Bike[], fallbackBikes: Bike[]): Bike[] {
  const targetActive = targetBikes.filter(
    (bike) => bike.status !== 'unavailable' && ACTIVE_STATUSES.has(bike.status),
  );
  const targetSold = targetBikes.filter((bike) => bike.status === 'sold');
  const fallback = fallbackBikes.filter((bike) => bike.status !== 'unavailable');
  const seen = new Set<number>();

  return [...targetActive, ...targetSold, ...fallback].filter((bike) => {
    if (seen.has(bike.id)) return false;
    seen.add(bike.id);
    return true;
  });
}

export function exactMake(bikes: Bike[], make: string): Bike[] {
  const normalizedMake = make.trim().toLowerCase();
  return bikes.filter((bike) => bike.make.trim().toLowerCase() === normalizedMake);
}

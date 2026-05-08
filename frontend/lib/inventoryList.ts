import type { Bike } from '@/types/Bike';
import { getServerBikes } from '@/lib/serverApi';

export interface InitialBikeList {
  bikes: Bike[];
  totalPages: number;
}

export async function getInitialBikeList(condition: string): Promise<InitialBikeList> {
  const params = new URLSearchParams({
    page: '1',
    condition,
  });

  try {
    const response = await getServerBikes(params);
    return {
      bikes: response.results,
      totalPages: Math.ceil(response.count / 12),
    };
  } catch (error) {
    console.error(`Failed to server-render ${condition} bike list:`, error);
    return {
      bikes: [],
      totalPages: 0,
    };
  }
}

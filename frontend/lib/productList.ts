import type { Product } from '@/types/Product';
import { getServerProducts } from '@/lib/serverApi';

export interface InitialProductList {
  products: Product[];
  totalPages: number;
}

export async function getInitialProductList(): Promise<InitialProductList> {
  try {
    const response = await getServerProducts(new URLSearchParams());
    return {
      products: response.results,
      totalPages: Math.ceil(response.count / 12),
    };
  } catch (error) {
    console.error('Failed to server-render e-scooter list:', error);
    return {
      products: [],
      totalPages: 0,
    };
  }
}

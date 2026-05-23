import { buildMetadata } from '@/lib/seo';
import { getServerBikes, getServerProducts } from '@/lib/serverApi';
import HomePage from '@/page_components/HomePage';
import type { Bike } from '@/types/Bike';
import type { Product } from '@/types/Product';

export const metadata = buildMetadata({
  title: 'Motorcycles, Scooters & Electric Scooters Perth',
  description: 'New and used motorcycles, scooters, and electric scooters for sale in Perth, plus servicing, tyre fitting, and free Australia-wide e-scooter delivery.',
  canonicalPath: '/',
});

export const revalidate = 300;

export default async function Page() {
  const [newBikes, usedBikes, products] = await Promise.all([
    fetchFeaturedBikes('new'),
    fetchFeaturedBikes('used', 'motorcycle'),
    fetchFeaturedProducts(),
  ]);

  return (
    <HomePage
      initialNewBikes={newBikes}
      initialUsedBikes={usedBikes}
      initialFeaturedProducts={products}
    />
  );
}

async function fetchFeaturedBikes(condition: string, vehicleType?: Bike['vehicle_type']): Promise<Bike[]> {
  const params = new URLSearchParams({
    page: '1',
    condition,
    is_featured: 'true',
  });
  if (vehicleType) {
    params.set('vehicle_type', vehicleType);
  }

  try {
    const response = await getServerBikes(params);
    return response.results.filter((bike) => bike.status !== 'unavailable');
  } catch (error) {
    console.error(`Failed to server-render featured ${condition} bikes:`, error);
    return [];
  }
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  const params = new URLSearchParams({ is_featured: 'true' });

  try {
    const response = await getServerProducts(params);
    return response.results.slice(0, 2);
  } catch (error) {
    console.error('Failed to server-render featured e-scooters:', error);
    return [];
  }
}

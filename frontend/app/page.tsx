import { buildMetadata } from '@/lib/seo';
import { getServerBikes, getServerProducts } from '@/lib/serverApi';
import HomePage from '@/page_components/HomePage';
import type { Bike } from '@/types/Bike';
import type { Product } from '@/types/Product';

export const metadata = buildMetadata({
  title: 'Motorcycles, Mopeds & Electric Scooters Perth',
  description: 'Sales, service, hire and tyre fitting. 30 years of experience working on Motorcycles, Scooters and now E-Scooters.',
  canonicalPath: '/',
});

export const revalidate = 300;

export default async function Page() {
  const [newBikes, usedBikes, products] = await Promise.all([
    fetchFeaturedBikes('new', 'scooter'),
    fetchFeaturedBikes('used'),
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

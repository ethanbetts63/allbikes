import { buildMetadata } from '@/lib/seo';
import { getServerBikes } from '@/lib/serverApi';
import MotorcycleServicePage from '@/page_components/MotorcycleServicePage';
import type { Bike } from '@/types/Bike';

export const metadata = buildMetadata({
  title: 'Motorcycle Service & Repairs Perth | Dianella Workshop',
  description: 'Motorcycle servicing, repairs, and tyre fitting in Perth. Honda, Yamaha, Kawasaki, Suzuki, Ducati, and all major brands. Book online.',
  canonicalPath: '/motorcycle-service',
});

export const revalidate = 300;

export default async function Page() {
  const usedMotorcycles = await fetchFeaturedUsedMotorcycles();
  return <MotorcycleServicePage initialUsedMotorcycles={usedMotorcycles} />;
}

async function fetchFeaturedUsedMotorcycles(): Promise<Bike[]> {
  const params = new URLSearchParams({
    page: '1',
    condition: 'used',
    vehicle_type: 'motorcycle',
    is_featured: 'true',
  });
  try {
    const response = await getServerBikes(params);
    return response.results.filter((bike) => bike.status !== 'unavailable');
  } catch {
    return [];
  }
}

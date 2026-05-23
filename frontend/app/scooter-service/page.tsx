import { buildMetadata } from '@/lib/seo';
import { getServerBikes } from '@/lib/serverApi';
import ScooterServicePage from '@/page_components/ScooterServicePage';
import type { Bike } from '@/types/Bike';

export const metadata = buildMetadata({
  title: 'Scooter Repairs & Servicing Perth | Dianella Workshop',
  description: 'Scooter servicing, repairs, and tyre fitting in Perth. Vespa, Piaggio, Aprilia, Honda, Yamaha, and all major brands. Book online.',
  canonicalPath: '/scooter-service',
});

export const revalidate = 300;

export default async function Page() {
  const usedScooters = await fetchFeaturedUsedScooters();
  return <ScooterServicePage initialUsedScooters={usedScooters} />;
}

async function fetchFeaturedUsedScooters(): Promise<Bike[]> {
  const params = new URLSearchParams({
    page: '1',
    condition: 'used',
    vehicle_type: 'scooter',
    is_featured: 'true',
  });
  try {
    const response = await getServerBikes(params);
    return response.results.filter((bike) => bike.status !== 'unavailable');
  } catch {
    return [];
  }
}

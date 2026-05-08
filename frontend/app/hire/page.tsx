import { buildMetadata } from '@/lib/seo';
import { getServerHireBikes } from '@/lib/serverApi';
import type { Bike } from '@/types/Bike';
import HireListPage from '@/page_components/HireListPage';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Motorcycle Hire Perth | Daily, Weekly & Monthly | ScooterShop',
  description: 'Hire a motorcycle in Perth from ScooterShop Dianella. Flexible daily, weekly, and monthly rates with maintained hire bikes.',
  canonicalPath: '/hire',
});

interface HirePageProps {
  searchParams?: Promise<{
    start?: string;
    end?: string;
  }>;
}

export default async function Page({ searchParams }: HirePageProps) {
  const params = await searchParams;
  const startDate = typeof params?.start === 'string' ? params.start : '';
  const endDate = typeof params?.end === 'string' ? params.end : '';
  const bikes = await fetchInitialHireBikes(startDate, endDate);

  return (
    <HireListPage
      initialBikes={bikes}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  );
}

async function fetchInitialHireBikes(startDate: string, endDate: string): Promise<Bike[]> {
  try {
    return await getServerHireBikes(startDate || undefined, endDate || undefined);
  } catch (error) {
    console.error('Failed to server-render hire bikes:', error);
    return [];
  }
}

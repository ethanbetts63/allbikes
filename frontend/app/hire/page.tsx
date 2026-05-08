import { buildMetadata } from '@/lib/seo';
import { getServerHireBikes } from '@/lib/serverApi';
import type { Bike } from '@/types/Bike';
import HireListPage from '@/pages_vite/HireListPage';

export const dynamic = 'force-dynamic';

export const metadata = buildMetadata({
  title: 'Motorcycle Hire Perth | Daily, Weekly & Monthly | ScooterShop',
  description: 'Hire a motorcycle in Perth from ScooterShop Dianella. Flexible daily, weekly, and monthly rates with maintained hire bikes.',
  canonicalPath: '/hire',
});

interface HirePageProps {
  searchParams?: {
    start?: string;
    end?: string;
  };
}

export default async function Page({ searchParams }: HirePageProps) {
  const startDate = typeof searchParams?.start === 'string' ? searchParams.start : '';
  const endDate = typeof searchParams?.end === 'string' ? searchParams.end : '';
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

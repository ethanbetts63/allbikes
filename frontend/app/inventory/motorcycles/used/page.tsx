import BikeListPage from '@/page_components/BikeListPage';
import { buildMetadata } from '@/lib/seo';
import { getInitialBikeList } from '@/lib/inventoryList';
import type { ListSearchParams } from '@/lib/listQuery';

export const metadata = buildMetadata({
  title: 'Used Motorcycles & Scooters | ScooterShop',
  description: 'Browse used motorcycles and scooters available in Perth. Quality pre-owned bikes inspected and prepared by the ScooterShop workshop.',
  canonicalPath: '/inventory/motorcycles/used',
});

export const revalidate = 300;

interface PageProps {
  searchParams?: Promise<ListSearchParams>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { bikes, totalPages, currentPage, filters } = await getInitialBikeList('used', params);

  return (
    <BikeListPage
      bikeCondition="used"
      bikes={bikes}
      totalPages={totalPages}
      currentPage={currentPage}
      filters={filters}
    />
  );
}

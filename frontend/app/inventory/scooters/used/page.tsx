import BikeListPage from '@/page_components/BikeListPage';
import { buildMetadata, buildBikeListSchema } from '@/lib/seo';
import { getInitialBikeList } from '@/lib/inventoryList';
import type { ListSearchParams } from '@/lib/listQuery';

export const metadata = buildMetadata({
  title: 'Used Scooters for Sale Perth',
  description: 'Browse used scooters for sale in Perth, including quality pre-owned mopeds and scooters inspected by the Dianella workshop.',
  canonicalPath: '/inventory/scooters/used',
});

export const revalidate = 300;

interface PageProps {
  searchParams?: Promise<ListSearchParams>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { bikes, totalPages, currentPage, filters } = await getInitialBikeList('used', params, { vehicle_type: 'scooter' });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBikeListSchema(bikes, 'Used Scooters for Sale', '/inventory/scooters/used')) }}
      />
      <BikeListPage
        bikeCondition="used"
        pageType="used-scooters"
        bikes={bikes}
        totalPages={totalPages}
        currentPage={currentPage}
        filters={filters}
      />
    </>
  );
}

import BikeListPage from '@/page_components/BikeListPage';
import { buildMetadata, buildBikeListSchema } from '@/lib/seo';
import { getInitialBikeList } from '@/lib/inventoryList';
import type { ListSearchParams } from '@/lib/listQuery';

export const metadata = buildMetadata({
  title: 'New Scooters for Sale Perth',
  description: 'Browse new scooters for sale in Perth, including petrol and electric models prepared by the workshop and backed by warranty.',
  canonicalPath: '/inventory/scooters/new',
});

export const revalidate = 300;

interface PageProps {
  searchParams?: Promise<ListSearchParams>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { bikes, totalPages, currentPage, filters } = await getInitialBikeList('new,demo', params, { vehicle_type: 'scooter' });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBikeListSchema(bikes, 'New Scooters for Sale', '/inventory/scooters/new')) }}
      />
      <BikeListPage
        bikeCondition="new,demo"
        bikes={bikes}
        totalPages={totalPages}
        currentPage={currentPage}
        filters={filters}
      />
    </>
  );
}

import BikeListPage from '@/page_components/BikeListPage';
import { buildMetadata, buildBikeListSchema } from '@/lib/seo';
import { getInitialBikeList } from '@/lib/inventoryList';
import type { ListSearchParams } from '@/lib/listQuery';

export const metadata = buildMetadata({
  title: 'Used Motorcycles & Scooters for Sale Perth',
  description: 'Browse used motorcycles and scooters for sale in Perth, with quality pre-owned bikes inspected and prepared by the workshop.',
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBikeListSchema(bikes, 'Used Motorcycles & Scooters for Sale', '/inventory/motorcycles/used')) }}
      />
      <BikeListPage
        bikeCondition="used"
        bikes={bikes}
        totalPages={totalPages}
        currentPage={currentPage}
        filters={filters}
      />
    </>
  );
}

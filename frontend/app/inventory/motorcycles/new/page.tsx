import BikeListPage from '@/page_components/BikeListPage';
import { buildMetadata, buildBikeListSchema } from '@/lib/seo';
import { getInitialBikeList } from '@/lib/inventoryList';
import type { ListSearchParams } from '@/lib/listQuery';

export const metadata = buildMetadata({
  title: 'New Motorcycles & Scooters | ScooterShop',
  description: 'Browse new motorcycles and scooters available in Perth, including petrol and electric models. Workshop-prepared and backed by warranty.',
  canonicalPath: '/inventory/motorcycles/new',
});

export const revalidate = 300;

interface PageProps {
  searchParams?: Promise<ListSearchParams>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { bikes, totalPages, currentPage, filters } = await getInitialBikeList('new,demo', params);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBikeListSchema(bikes, 'New Motorcycles & Scooters for Sale', '/inventory/motorcycles/new')) }}
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

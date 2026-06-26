import BikeListPage from '@/page_components/BikeListPage';
import { buildMetadata, buildBikeListSchema } from '@/lib/seo';
import { getInitialBikeList } from '@/lib/inventoryList';
import type { ListSearchParams } from '@/lib/listQuery';

export const metadata = buildMetadata({
  title: 'Buy New Scooters in Perth | SYM Petrol & Segway Electric',
  description: 'Brand-new SYM petrol scooters and Segway electric mopeds for sale in Perth. Workshop-prepared, backed by warranty. Browse online or visit our Dianella store.',
  canonicalPath: '/inventory/scooters/new',
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

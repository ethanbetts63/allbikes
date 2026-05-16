import BikeListPage from '@/page_components/BikeListPage';
import { buildBikeListSchema, buildMetadata } from '@/lib/seo';
import { getInitialBikeList } from '@/lib/inventoryList';
import type { ListSearchParams } from '@/lib/listQuery';

export const metadata = buildMetadata({
  title: 'Workshop Clearance | ScooterShop',
  description: 'Browse workshop clearance motorcycles and scooters sold as-is for parts, projects, and mechanical restoration.',
  canonicalPath: '/inventory/motorcycles/parts',
});

export const revalidate = 300;

interface PageProps {
  searchParams?: Promise<ListSearchParams>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const { bikes, totalPages, currentPage, filters } = await getInitialBikeList('parts', params);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBikeListSchema(bikes, 'Workshop Clearance Motorcycles & Scooters', '/inventory/motorcycles/parts')) }}
      />
      <BikeListPage
        bikeCondition="parts"
        bikes={bikes}
        totalPages={totalPages}
        currentPage={currentPage}
        filters={filters}
      />
    </>
  );
}

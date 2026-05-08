import BikeListPage from '@/page_components/BikeListPage';
import { buildMetadata } from '@/lib/seo';
import { getInitialBikeList } from '@/lib/inventoryList';

export const metadata = buildMetadata({
  title: 'Workshop Clearance | ScooterShop',
  description: 'Browse workshop clearance motorcycles and scooters sold as-is for parts, projects, and mechanical restoration.',
  canonicalPath: '/inventory/motorcycles/parts',
});

export const revalidate = 300;

export default async function Page() {
  const { bikes, totalPages } = await getInitialBikeList('parts');
  return (
    <BikeListPage
      bikeCondition="parts"
      initialBikes={bikes}
      initialTotalPages={totalPages}
    />
  );
}

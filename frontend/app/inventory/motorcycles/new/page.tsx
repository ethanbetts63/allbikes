import BikeListPage from '@/page_components/BikeListPage';
import { buildMetadata } from '@/lib/seo';
import { getInitialBikeList } from '@/lib/inventoryList';

export const metadata = buildMetadata({
  title: 'New Motorcycles & Scooters | ScooterShop',
  description: 'Browse new motorcycles and scooters available in Perth, including petrol and electric models. Workshop-prepared and backed by warranty.',
  canonicalPath: '/inventory/motorcycles/new',
});

export const revalidate = 300;

export default async function Page() {
  const { bikes, totalPages } = await getInitialBikeList('new,demo');
  return (
    <BikeListPage
      bikeCondition="new,demo"
      initialBikes={bikes}
      initialTotalPages={totalPages}
    />
  );
}

import BikeListPage from '@/page_components/BikeListPage';
import { buildMetadata } from '@/lib/seo';
import { getInitialBikeList } from '@/lib/inventoryList';

export const metadata = buildMetadata({
  title: 'Used Motorcycles & Scooters | ScooterShop',
  description: 'Browse used motorcycles and scooters available in Perth. Quality pre-owned bikes inspected and prepared by the ScooterShop workshop.',
  canonicalPath: '/inventory/motorcycles/used',
});

export const revalidate = 300;

export default async function Page() {
  const { bikes, totalPages } = await getInitialBikeList('used');
  return (
    <BikeListPage
      bikeCondition="used"
      initialBikes={bikes}
      initialTotalPages={totalPages}
    />
  );
}

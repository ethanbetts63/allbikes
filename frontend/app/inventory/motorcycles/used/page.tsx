import BikeListPage from '@/pages_vite/BikeListPage';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Used Motorcycles & Scooters | ScooterShop',
  description: 'Browse used motorcycles and scooters available in Perth. Quality pre-owned bikes inspected and prepared by the ScooterShop workshop.',
  canonicalPath: '/inventory/motorcycles/used',
});

export default function Page() {
  return <BikeListPage bikeCondition="used" />;
}

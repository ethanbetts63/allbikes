import BikeListPage from '@/pages_vite/BikeListPage';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'New Motorcycles & Scooters | ScooterShop',
  description: 'Browse new motorcycles and scooters available in Perth, including petrol and electric models. Workshop-prepared and backed by warranty.',
  canonicalPath: '/inventory/motorcycles/new',
});

export default function Page() {
  return <BikeListPage bikeCondition="new,demo" />;
}

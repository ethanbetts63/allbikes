import BikeListPage from '@/pages_vite/BikeListPage';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Workshop Clearance | ScooterShop',
  description: 'Browse workshop clearance motorcycles and scooters sold as-is for parts, projects, and mechanical restoration.',
  canonicalPath: '/inventory/motorcycles/parts',
});

export default function Page() {
  return <BikeListPage bikeCondition="parts" />;
}

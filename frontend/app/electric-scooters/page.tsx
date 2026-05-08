import { buildMetadata } from '@/lib/seo';
import { getServerProducts } from '@/lib/serverApi';
import type { Product } from '@/types/Product';
import ElectricScootersLandingPage from '@/page_components/ElectricScootersLandingPage';

export const metadata = buildMetadata({
  title: 'Buy Electric Scooters Online | Free Delivery Australia-Wide | ScooterShop',
  description: 'Shop electric scooters online with free delivery Australia-wide. All prices include GST. Secure checkout via Stripe and 12-month warranty on every e-scooter.',
  canonicalPath: '/electric-scooters',
});

export const revalidate = 300;

export default async function Page() {
  const featuredProducts = await fetchFeaturedProducts();

  return <ElectricScootersLandingPage initialFeaturedProducts={featuredProducts} />;
}

async function fetchFeaturedProducts(): Promise<Product[]> {
  const params = new URLSearchParams({ is_featured: 'true' });

  try {
    const response = await getServerProducts(params);
    return response.results.slice(0, 2);
  } catch (error) {
    console.error('Failed to server-render featured e-scooters landing page products:', error);
    return [];
  }
}

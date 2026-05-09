import type { Metadata } from 'next';
import { getBikeMetadata } from '@/lib/seo';
import { getServerBikeById, getServerBikes, getServerDepositSettings } from '@/lib/serverApi';
import BikeDetailPage from '@/page_components/BikeDetailPage';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  return getBikeMetadata(slug);
}

export const revalidate = 300;

export default async function Page(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const id = slug.split('-').pop();
  const bike = id ? await getBikeOrNull(id) : null;
  const shouldFetchDeposit = bike && ['new', 'demo', 'used'].includes(bike.condition) && bike.status === 'for_sale';
  const [newBikes, usedBikes, depositSettings] = await Promise.all([
    fetchFeaturedBikes('new'),
    fetchFeaturedBikes('used,demo'),
    shouldFetchDeposit ? getDepositSettingsOrNull() : null,
  ]);

  return (
    <BikeDetailPage
      initialBike={bike}
      initialNewBikes={newBikes}
      initialUsedBikes={usedBikes}
      depositAmount={depositSettings?.deposit_amount ?? null}
    />
  );
}

async function getBikeOrNull(id: string) {
  try {
    return await getServerBikeById(id);
  } catch (error) {
    console.error(`Failed to server-render bike ${id}:`, error);
    return null;
  }
}

async function fetchFeaturedBikes(condition: string) {
  const params = new URLSearchParams({
    page: '1',
    condition,
    is_featured: 'true',
  });

  try {
    const response = await getServerBikes(params);
    return response.results;
  } catch (error) {
    console.error(`Failed to server-render featured ${condition} bikes:`, error);
    return [];
  }
}

async function getDepositSettingsOrNull() {
  try {
    return await getServerDepositSettings();
  } catch (error) {
    console.error('Failed to server-render deposit settings:', error);
    return null;
  }
}

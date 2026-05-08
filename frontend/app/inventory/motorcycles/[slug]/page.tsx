import type { Metadata } from 'next';
import { getBikeMetadata } from '@/lib/seo';
import { getServerBikeById } from '@/lib/serverApi';
import BikeDetailPage from '@/pages_vite/BikeDetailPage';

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
  return <BikeDetailPage initialBike={bike} />;
}

async function getBikeOrNull(id: string) {
  try {
    return await getServerBikeById(id);
  } catch (error) {
    console.error(`Failed to server-render bike ${id}:`, error);
    return null;
  }
}

import type { Metadata } from 'next';
import { getBikeMetadata } from '@/lib/seo';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  return getBikeMetadata(slug);
}

export { default } from '@/pages_vite/BikeDetailPage';

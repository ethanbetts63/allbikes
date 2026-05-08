import type { Metadata } from 'next';
import { getProductMetadata } from '@/lib/seo';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  return getProductMetadata(slug);
}

export { default } from '@/pages_vite/EScooterDetailPage';

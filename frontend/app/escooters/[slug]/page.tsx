import type { Metadata } from 'next';
import { getProductMetadata } from '@/lib/seo';
import { getServerProductById } from '@/lib/serverApi';
import EScooterDetailPage from '@/page_components/EScooterDetailPage';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  return getProductMetadata(slug);
}

export const revalidate = 300;

export default async function Page(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const id = Number(slug.split('-').pop());
  const product = id && !Number.isNaN(id) ? await getProductOrNull(id) : null;
  return <EScooterDetailPage initialProduct={product} />;
}

async function getProductOrNull(id: number) {
  try {
    return await getServerProductById(id);
  } catch (error) {
    console.error(`Failed to server-render product ${id}:`, error);
    return null;
  }
}

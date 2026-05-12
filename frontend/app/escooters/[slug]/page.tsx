import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getProductMetadata, buildProductSchema } from '@/lib/seo';
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
  if (!id || Number.isNaN(id)) {
    notFound();
  }

  const product = await getProductOrNull(id);
  if (!product) {
    notFound();
  }

  if (product.slug !== slug) {
    permanentRedirect(`/escooters/${product.slug}`);
  }

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductSchema(product)) }}
        />
      )}
      <EScooterDetailPage initialProduct={product} />
    </>
  );
}

async function getProductOrNull(id: number) {
  try {
    return await getServerProductById(id);
  } catch (error) {
    console.error(`Failed to server-render product ${id}:`, error);
    return null;
  }
}

import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { preload } from 'react-dom';
import { getProductMetadata, buildProductSchema } from '@/lib/seo';
import { getServerProductById } from '@/lib/serverApi';
import EScooterDetailPage from '@/page_components/EScooterDetailPage';
import type { Product } from '@/types/Product';
import { getPrimaryVehicleImage } from '@/utils/vehicleImages';

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

  const primaryImage = getPrimaryProductImage(product);
  if (primaryImage) {
    preload(primaryImage, {
      as: 'image',
      fetchPriority: 'high',
    });
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

function getPrimaryProductImage(product: Product): string | null {
  return getPrimaryVehicleImage(product.images, 'detail');
}

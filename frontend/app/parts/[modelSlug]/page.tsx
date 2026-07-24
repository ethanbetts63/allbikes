import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPartsModel } from '@/lib/partsApi';
import PartsModelPage from '@/page_components/parts/PartsModelPage';

interface PageProps {
  params: Promise<{ modelSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { modelSlug } = await params;
  try {
    const model = await getPartsModel(modelSlug);
    return {
      title: `${model.name} (${model.model_code}) Spare Parts | SYM`,
      description: `Genuine SYM ${model.name} spare parts. Browse the exploded-diagram sections and order the exact part with live availability.`,
    };
  } catch {
    return { title: 'SYM Spare Parts' };
  }
}

export const revalidate = 300;

export default async function Page({ params }: PageProps) {
  const { modelSlug } = await params;
  try {
    const model = await getPartsModel(modelSlug);
    return <PartsModelPage model={model} />;
  } catch {
    notFound();
  }
}

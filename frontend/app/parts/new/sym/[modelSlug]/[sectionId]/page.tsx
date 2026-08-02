import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPartsSection } from '@/lib/partsApi';
import { buildPartSectionSchema } from '@/lib/seo';
import StructuredDataScript from '@/components/seo/StructuredDataScript';
import SectionDiagramView from './_components/SectionDiagramView';

interface PageProps {
  params: Promise<{ modelSlug: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { modelSlug, sectionId } = await params;
  try {
    const section = await getPartsSection(modelSlug, sectionId);
    return {
      title: `${section.name} — ${section.model.name} | SYM Parts`,
      description: `Order ${section.name} parts for the SYM ${section.model.name} from the exploded diagram, with live availability.`,
    };
  } catch {
    return { title: 'New SYM Parts Australia' };
  }
}

export default async function Page({ params }: PageProps) {
  const { modelSlug, sectionId } = await params;
  let section;
  try {
    section = await getPartsSection(modelSlug, sectionId);
  } catch {
    notFound();
  }
  return (
    <>
      <StructuredDataScript structuredData={buildPartSectionSchema(section)} />
      <SectionDiagramView section={section} />
    </>
  );
}

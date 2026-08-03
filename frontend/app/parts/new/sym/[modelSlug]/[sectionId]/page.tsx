import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPartsSection } from '@/lib/partsApi';
import { buildMetadata, buildPartSectionSchema } from '@/lib/seo';
import { parseSectionSlug, symPartsSectionPath } from '@/app/parts/_lib/routes';
import StructuredDataScript from '@/components/seo/StructuredDataScript';
import SectionDiagramView from './_components/SectionDiagramView';

interface PageProps {
  // `sectionId` is the URL segment, shaped `{code}-{name-slug}` (e.g.
  // "e01-shroud-assy") — see parseSectionSlug. The folder keeps this param
  // name for historical reasons; it never appears in the URL itself.
  params: Promise<{ modelSlug: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { modelSlug, sectionId } = await params;
  const sectionCode = parseSectionSlug(sectionId);
  try {
    const section = await getPartsSection(modelSlug, sectionCode);
    return buildMetadata({
      title: `${section.name} — ${section.model.name} | SYM Parts`,
      description: `Order ${section.name} parts for the SYM ${section.model.name} from the exploded diagram, with live availability.`,
      canonicalPath: symPartsSectionPath(modelSlug, section.code, section.name),
    });
  } catch {
    return { title: 'New SYM Parts Australia' };
  }
}

export default async function Page({ params }: PageProps) {
  const { modelSlug, sectionId } = await params;
  const sectionCode = parseSectionSlug(sectionId);
  let section;
  try {
    section = await getPartsSection(modelSlug, sectionCode);
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

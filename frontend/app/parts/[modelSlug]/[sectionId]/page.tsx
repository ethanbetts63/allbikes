import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPartsSection } from '@/lib/partsApi';
import PartsSectionPage from './PartsSectionPage';

interface PageProps {
  params: Promise<{ modelSlug: string; sectionId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sectionId } = await params;
  try {
    const section = await getPartsSection(sectionId);
    return {
      title: `${section.name} — ${section.model.name} | SYM Parts`,
      description: `Order ${section.name} parts for the SYM ${section.model.name} from the exploded diagram, with live availability.`,
    };
  } catch {
    return { title: 'SYM Spare Parts' };
  }
}

export default async function Page({ params }: PageProps) {
  const { sectionId } = await params;
  try {
    const section = await getPartsSection(sectionId);
    return <PartsSectionPage section={section} />;
  } catch {
    notFound();
  }
}

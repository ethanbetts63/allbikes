import { permanentRedirect } from 'next/navigation';
import { symPartsSectionPath } from '@/app/parts/_lib/routes';

interface PageProps {
  params: Promise<{ modelSlug: string; sectionId: string }>;
}

/** Legacy section URL: preserve existing links and transfer signals to the canonical path. */
export default async function Page({ params }: PageProps) {
  const { modelSlug, sectionId } = await params;
  permanentRedirect(symPartsSectionPath(modelSlug, sectionId));
}

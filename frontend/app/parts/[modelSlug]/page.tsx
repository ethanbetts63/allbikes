import { permanentRedirect } from 'next/navigation';
import { symPartsModelPath } from '@/app/parts/_lib/routes';

interface PageProps {
  params: Promise<{ modelSlug: string }>;
}

/** Legacy model URL: preserve existing links and transfer signals to the canonical path. */
export default async function Page({ params }: PageProps) {
  const { modelSlug } = await params;
  permanentRedirect(symPartsModelPath(modelSlug));
}

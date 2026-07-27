import { permanentRedirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ modelSlug: string }>;
}

/** Legacy model URL: preserve existing links and transfer signals to the canonical path. */
export default async function Page({ params }: PageProps) {
  const { modelSlug } = await params;
  permanentRedirect(`/parts/new/sym/${modelSlug}`);
}

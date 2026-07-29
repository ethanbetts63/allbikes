import Link from 'next/link';
import Image from 'next/image';
import type { PartSectionSummary, PartsModelDetail } from '@/types/parts';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPartsModel } from '@/lib/partsApi';

interface PageProps {
  params: Promise<{ modelSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { modelSlug } = await params;
  try {
    const model = await getPartsModel(modelSlug);
    return {
      title: `${model.name} (${model.model_code}) Spare Parts | SYM`,
      description: `Genuine new SYM ${model.name} spare parts. Browse the exploded-diagram sections and order the exact part with live availability.`,
    };
  } catch {
    return { title: 'New Genuine SYM Parts' };
  }
}

export const revalidate = 300;

export default async function Page({ params }: PageProps) {
  const { modelSlug } = await params;
  let model: PartsModelDetail;
  try {
    model = await getPartsModel(modelSlug);
  } catch {
    notFound();
  }
  return <PartsModelPage model={model} />;
}

function PartsModelPage({ model }: { model: PartsModelDetail }) {
  const engine = model.sections.filter((section) => section.group === 'engine');
  const frame = model.sections.filter((section) => section.group === 'frame');
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-600">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/parts/new/sym" className="hover:underline">New SYM Parts</Link>
        <span className="mx-2">/</span>
        <span className="text-black">{model.name}</span>
      </nav>
      <h1 className="text-2xl font-bold text-black">{model.name} <span className="text-gray-500">({model.model_code})</span></h1>
      <p className="mt-2 text-gray-600">Choose a section to see its exploded diagram and parts.</p>
      <SectionGroup title="Engine" slug={model.slug} sections={engine} />
      <SectionGroup title="Frame / Body" slug={model.slug} sections={frame} />
    </div>
  );
}

function SectionGroup({ title, slug, sections }: { title: string; slug: string; sections: PartSectionSummary[] }) {
  if (sections.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-black">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sections.map((section) => (
          <Link key={section.id} href={`/parts/new/sym/${slug}/${section.code}`} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-black">
            <div className="relative flex h-32 items-center justify-center bg-white">
              {section.diagram_thumb ? <Image src={section.diagram_thumb} alt={`${section.name} diagram`} fill sizes="(max-width: 640px) 50vw, 25vw" unoptimized className="object-contain p-2" /> : <span className="text-xs text-gray-400">No diagram</span>}
            </div>
            <div className="border-t border-gray-100 px-3 py-2"><span className="block font-mono text-xs text-gray-500">{section.code}</span><span className="block text-sm font-medium text-black">{section.name}</span></div>
          </Link>
        ))}
      </div>
    </section>
  );
}

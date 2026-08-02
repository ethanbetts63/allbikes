import Link from 'next/link';
import Image from 'next/image';
import type { PartSectionSummary, PartsModelDetail } from '@/types/parts';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPartsModel } from '@/lib/partsApi';
import EquivalentSections from '@/app/parts/_components/EquivalentSections';
import HowPartsLookupWorks from '@/app/parts/_components/HowPartsLookupWorks';
import { SYM_PARTS_PATH, symPartsModelPath, symPartsSectionPath } from '@/app/parts/_lib/routes';

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
  const priorityEngineDiagrams = Math.min(2, engine.filter((section) => section.diagram_thumb).length);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-600">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <Link href={SYM_PARTS_PATH} className="hover:underline">New SYM Parts</Link>
        <span className="mx-2">/</span>
        <span className="text-black">{model.name}</span>
      </nav>
      <h1 className="text-2xl font-bold text-black">{model.name} <span className="text-gray-500">({model.model_code})</span></h1>
      <p className="mt-2 text-gray-600">Choose a section to see its exploded diagram and parts.</p>
      <SectionGroup title="Engine" slug={model.slug} sections={engine} priorityDiagramCount={priorityEngineDiagrams} />
      <SectionGroup title="Frame / Body" slug={model.slug} sections={frame} priorityDiagramCount={2 - priorityEngineDiagrams} />
      <SharedModelsPanel modelName={model.name} modelCode={model.model_code} models={model.shared_models} />
      <HowPartsLookupWorks />
    </div>
  );
}

function SharedModelsPanel({
  modelName,
  modelCode,
  models = [],
}: {
  modelName: string;
  modelCode: string;
  models?: PartsModelDetail['shared_models'];
}) {
  if (models.length === 0) return null;

  return (
    // Below lg the panel breaks out of the page's px-4 gutter to sit flush with
    // the screen edges, so it drops its rounding and side borders to match.
    <section className="-mx-4 mt-10 overflow-hidden border-y border-gray-200 bg-white lg:mx-0 lg:rounded-lg lg:border-x">
      <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
        <h2 className="font-semibold text-black">
          Models that share the most parts with {modelName} <span className="font-mono text-sm font-normal text-gray-500">({modelCode})</span>
        </h2>
        <p className="mt-1 text-sm text-gray-600">Top five models ranked by the share of this model&apos;s part numbers they also list.</p>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <div className="space-y-4 p-4 sm:p-5">
          {models.map((shared) => (
            <div key={shared.slug}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <Link href={symPartsModelPath(shared.slug)} className="min-w-0 truncate font-medium text-black hover:underline">
                  {shared.name} <span className="font-mono text-xs text-gray-500">{shared.model_code}</span>
                </Link>
                <span className="shrink-0 text-xs text-gray-600">
                  {shared.shared_part_count} parts · {shared.shared_part_percentage}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-highlight transition-[width]"
                  style={{ width: `${Math.min(shared.shared_part_percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <aside className="border-t border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 sm:p-5 lg:border-l lg:border-t-0">
          <h3 className="font-semibold text-black">Why this helps</h3>
          <p className="mt-2">
            It can be difficult to identify the exact model codes on older bikes and bikes imported to Australia. These closely related books are a useful starting point when you need to compare a part against another bike.
          </p>
          <p className="mt-3">
            Each diagram also identifies the other models that use a part number. That helps you shop with more confidence and lets mechanics find a match among bikes already in their own stock.
          </p>
          <p className="mt-3 text-xs text-gray-500">Always confirm the part number and fitment before ordering.</p>
        </aside>
      </div>
    </section>
  );
}

function SectionGroup({
  title,
  slug,
  sections,
  priorityDiagramCount = 0,
}: {
  title: string;
  slug: string;
  sections: PartSectionSummary[];
  priorityDiagramCount?: number;
}) {
  if (sections.length === 0) return null;
  let eagerImagesRemaining = priorityDiagramCount;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-black">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sections.map((section) => {
          const isHighPriority = Boolean(section.diagram_thumb) && eagerImagesRemaining-- > 0;
          return (
          // The tile stays a single link; the disclosure sits outside it so
          // expanding it never navigates away.
          <div key={section.id} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-[var(--highlight)]">
            <Link href={symPartsSectionPath(slug, section.code)} className="flex flex-col">
              <div className="relative flex h-32 items-center justify-center bg-white">
                {section.diagram_thumb ? <Image src={section.diagram_thumb} alt={`${section.name} diagram`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 288px" loading={isHighPriority ? "eager" : "lazy"} fetchPriority={isHighPriority ? "high" : undefined} className="object-contain p-2" /> : <span className="text-xs text-gray-400">No diagram</span>}
              </div>
              <div className="border-t border-gray-100 px-3 py-2"><span className="block font-mono text-xs text-gray-500">{section.code}</span><span className="block text-sm font-medium text-black">{section.name}</span></div>
            </Link>
            {(section.equivalent_sections?.length ?? 0) > 0 && (
              <div className="border-t border-gray-100 px-3 py-2">
                <EquivalentSections sections={section.equivalent_sections} />
              </div>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
}

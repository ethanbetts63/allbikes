import Link from 'next/link';
import Image from 'next/image';
import type { PartSectionSummary, PartsModelDetail } from '@/types/parts';

export default function PartsModelPage({ model }: { model: PartsModelDetail }) {
  const engine = model.sections.filter((s) => s.group === 'engine');
  const frame = model.sections.filter((s) => s.group === 'frame');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/parts" className="hover:underline">
          SYM Parts
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{model.name}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900">
        {model.name} <span className="text-gray-400">({model.model_code})</span>
      </h1>
      <p className="mt-2 text-gray-600">Choose a section to see its exploded diagram and parts.</p>

      <SectionGroup title="Engine" slug={model.slug} sections={engine} />
      <SectionGroup title="Frame / Body" slug={model.slug} sections={frame} />
    </div>
  );
}

function SectionGroup({
  title,
  slug,
  sections,
}: {
  title: string;
  slug: string;
  sections: PartSectionSummary[];
}) {
  if (sections.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={`/parts/${slug}/${section.id}`}
            className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-gray-400 hover:shadow"
          >
            <div className="relative flex h-32 items-center justify-center bg-white">
              {section.diagram_thumb ? (
                <Image
                  src={section.diagram_thumb}
                  alt={`${section.name} diagram`}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  unoptimized
                  className="object-contain p-2"
                />
              ) : (
                <span className="text-xs text-gray-400">No diagram</span>
              )}
            </div>
            <div className="border-t border-gray-100 px-3 py-2">
              <span className="block text-xs font-mono text-gray-400">{section.code}</span>
              <span className="block text-sm font-medium text-gray-800">{section.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

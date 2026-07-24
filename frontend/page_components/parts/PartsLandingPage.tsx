import Link from 'next/link';
import Image from 'next/image';
import { CC_CLASS_LABELS, CC_CLASS_ORDER } from '@/lib/partsApi';
import { MODEL_IMAGES } from '@/lib/modelImages';
import type { CcClass, PartsModelListItem } from '@/types/parts';

export default function PartsLandingPage({ models }: { models: PartsModelListItem[] }) {
  const grouped = CC_CLASS_ORDER.map((cc) => ({
    cc,
    label: CC_CLASS_LABELS[cc],
    models: models.filter((m) => m.cc_class === cc),
  })).filter((g) => g.models.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-black">SYM Spare Parts</h1>
      <p className="mt-2 max-w-2xl text-gray-600">
        Choose your model, open the relevant section, and add the parts you need straight from the
        exploded diagram. Availability and pricing are shown per part.
      </p>

      {grouped.length === 0 && (
        <p className="mt-8 text-gray-500">No models available yet. Please check back soon.</p>
      )}

      {grouped.map((group) => (
        <section key={group.cc} className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-black">{group.label}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {group.models.map((model) => (
              <ModelCard key={model.slug} model={model} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ModelCard({ model }: { model: PartsModelListItem }) {
  const image = MODEL_IMAGES[model.slug];
  return (
    <Link
      href={`/parts/${model.slug}`}
      className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-black"
    >
      <div className="relative flex h-36 items-center justify-center bg-white">
        {image ? (
          <Image
            src={image}
            alt={model.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            placeholder="blur"
            className="object-contain p-3"
          />
        ) : (
          <span className="text-sm font-bold uppercase tracking-widest text-gray-300">SYM</span>
        )}
      </div>
      <div className="border-t border-gray-100 px-4 py-3">
        <span className="block font-semibold text-black">{model.name}</span>
        <span className="mt-0.5 block text-sm text-gray-500">{model.model_code}</span>
      </div>
    </Link>
  );
}

export type { CcClass };

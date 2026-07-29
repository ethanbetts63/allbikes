import Link from 'next/link';
import Image from 'next/image';
import { MODEL_IMAGES } from '@/app/parts/_lib/modelImages';
import type { PartsModelListItem } from '@/types/parts';

/** Model tile with product photo — shared by the parts landing grid and search results. */
export default function ModelCard({ model }: { model: PartsModelListItem }) {
  const image = MODEL_IMAGES[model.slug];
  return (
    <Link
      href={`/parts/new/sym/${model.slug}`}
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

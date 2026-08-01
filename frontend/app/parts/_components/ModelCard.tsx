import Link from 'next/link';
import Image from 'next/image';
import { MODEL_IMAGES } from '@/app/parts/_lib/modelImages';
import { symPartsModelPath } from '@/app/parts/_lib/routes';
import type { PartsModelListItem } from '@/types/parts';

/** Model tile with product photo — shared by the parts landing grid and search results. */
type ModelCardModel = Pick<PartsModelListItem, 'name' | 'model_code' | 'slug'>;

export default function ModelCard({ model }: { model: ModelCardModel }) {
  const image = MODEL_IMAGES[model.model_code.toUpperCase()];
  return (
    <Link
      href={symPartsModelPath(model.slug)}
      className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:border-[var(--highlight)]"
    >
      <div className="relative flex h-36 items-center justify-center bg-white">
        {image ? (
          <Image
            src={image}
            alt={model.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
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

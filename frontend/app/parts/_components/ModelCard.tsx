import Link from 'next/link';
import Image from 'next/image';
import { MODEL_IMAGES } from '@/app/parts/_lib/modelImages';
import { symPartsModelPath } from '@/app/parts/_lib/routes';
import type { PartsModelListItem } from '@/types/parts';

/** Model tile with product photo — shared by the parts landing grid and search results. */
type ModelCardModel = Pick<PartsModelListItem, 'name' | 'model_code' | 'slug'>;

/**
 * Both callers — the landing carousel and the search grid — lay tiles out 1-up
 * on mobile, 3-up on tablet and 4-up from lg. The grid is capped by max-w-6xl,
 * so past ~1150px the tile stops growing at ~288px; the fixed final value keeps
 * the browser from over-fetching, which `25vw` does on wide screens.
 */
const TILE_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 288px';

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
            // Pass the URL, not the StaticImageData object: `fill` makes the
            // intrinsic dimensions redundant, and the object would drag its
            // base64 blurDataURL across the server/client boundary into the RSC
            // payload for every tile.
            src={image.src}
            alt={model.name}
            fill
            sizes={TILE_SIZES}
            loading="lazy"
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

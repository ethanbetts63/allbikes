import type { StaticImageData } from 'next/image';

type ImportedAsset = string | StaticImageData | { src?: string };

export function assetUrl(asset: ImportedAsset): string {
  if (typeof asset === 'string') return asset;
  if (asset && typeof asset.src === 'string') return asset.src;
  return String(asset);
}

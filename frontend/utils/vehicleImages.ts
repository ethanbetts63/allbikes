type VehicleImage = {
  image?: string | null;
  medium?: string | null;
  thumbnail?: string | null;
  order?: number | null;
};

export type VehicleImageUse = 'thumbnail' | 'card' | 'detail';

export function getPrimaryVehicleImage(
  images: VehicleImage[] | null | undefined,
  use: VehicleImageUse
): string | null {
  const primaryImage = getSortedVehicleImages(images)[0];
  return primaryImage ? getVehicleImageUrl(primaryImage, use) : null;
}

export function getSortedVehicleImages<T extends VehicleImage>(images: T[] | null | undefined): T[] {
  return [...(images ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getVehicleImageUrl(image: VehicleImage | null | undefined, use: VehicleImageUse): string | null {
  if (!image) return null;

  if (use === 'detail') {
    return image.medium || image.image || image.thumbnail || null;
  }

  return image.thumbnail || image.medium || image.image || null;
}

import type { StaticImageData } from 'next/image';

export interface BrandProps {
  image: StaticImageData;
  alt: string;
  title: string;
  subtitle: string;
  description: string;
  imageLeft?: boolean;
}

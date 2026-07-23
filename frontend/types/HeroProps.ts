import type React from 'react';
import type { StaticImageData } from 'next/image';

export interface HeroProps {
  title: React.ReactNode;
  description: string;
  image: StaticImageData;
  centered?: boolean;
}

import type React from 'react';

export interface HeroProps {
  title: React.ReactNode;
  description: string;
  imageUrl: string;
  imageSrcSet?: string;
  imageSizes?: string;
  centered?: boolean;
}

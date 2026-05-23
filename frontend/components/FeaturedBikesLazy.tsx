"use client";

import dynamic from 'next/dynamic';
import type { FeaturedBikesProps } from '@/types/FeaturedBikesProps';

const FeaturedBikes = dynamic(() => import('@/components/FeaturedBikes'), { ssr: false });

export default function FeaturedBikesLazy(props: FeaturedBikesProps) {
  return <FeaturedBikes {...props} />;
}

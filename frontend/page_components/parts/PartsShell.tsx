'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { PartsCartProvider } from '@/context/PartsCartContext';
import PartsSearchBar from '@/components/parts/PartsSearchBar';
import PartsCartButton from '@/components/parts/PartsCartButton';

export default function PartsShell({ children }: { children: React.ReactNode }) {
  return (
    <PartsCartProvider>
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
          <Link href="/parts" className="whitespace-nowrap text-lg font-bold text-gray-900">
            SYM Parts
          </Link>
          <div className="flex-1">
            <Suspense fallback={<div className="h-10 rounded-md border border-gray-200 bg-white" />}>
              <PartsSearchBar />
            </Suspense>
          </div>
          <PartsCartButton />
        </div>
      </div>
      {children}
    </PartsCartProvider>
  );
}

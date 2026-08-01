'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import symLogo from '@/assets/sym_logo.png';
import { PartsCartProvider } from '@/app/parts/_components/PartsCartContext';
import PartsSearchBar from '@/app/parts/_components/PartsSearchBar';
import PartsCartButton from '@/app/parts/_components/PartsCartButton';

export default function PartsShell({ children }: { children: React.ReactNode }) {
  return (
    <PartsCartProvider>
      <div className="min-h-screen bg-white text-black">
        <div className="border-b border-gray-200 bg-white sm:sticky sm:top-0 sm:z-40">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
            <Link href="/parts/new/sym" aria-label="SYM Parts" className="shrink-0">
              <Image src={symLogo} alt="SYM" className="h-9 w-auto object-contain" priority />
            </Link>
            <div className="flex-1">
              <Suspense fallback={<div className="h-10 rounded-md border border-gray-300 bg-white" />}>
                <PartsSearchBar />
              </Suspense>
            </div>
            <PartsCartButton />
          </div>
        </div>
        {children}
      </div>
    </PartsCartProvider>
  );
}

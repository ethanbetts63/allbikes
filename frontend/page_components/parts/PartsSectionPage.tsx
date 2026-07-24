'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import CalloutRow from '@/components/parts/CalloutRow';
import type { SectionDetail } from '@/types/parts';

export default function PartsSectionPage({ section }: { section: SectionDetail }) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-600">
        <Link href="/parts" className="hover:underline">
          SYM Parts
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/parts/${section.model.slug}`} className="hover:underline">
          {section.model.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black">{section.name}</span>
      </nav>

      <h1 className="mb-6 text-xl font-bold text-black">
        <span className="font-mono text-gray-500">{section.code}</span> {section.name}
        <span className="ml-2 text-sm font-normal text-gray-500">{section.model.name}</span>
      </h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:sticky lg:top-4 lg:self-start">
          {section.diagram_image ? (
            <div className="overflow-auto rounded-lg border border-gray-200 bg-white p-2">
              <Image
                src={section.diagram_image}
                alt={`${section.name} exploded diagram`}
                width={800}
                height={600}
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
                onClick={() => setZoomed((z) => !z)}
                className={`mx-auto h-auto w-full cursor-zoom-in origin-top transition-transform ${
                  zoomed ? 'scale-150 cursor-zoom-out' : ''
                }`}
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-500">
              Diagram not available — use the parts list.
            </div>
          )}
          <p className="mt-1 text-center text-xs text-gray-500">Click the diagram to zoom.</p>
        </div>

        <div>
          <ul className="rounded-lg border border-gray-200 bg-white px-4">
            {section.callouts.map((callout) => (
              <CalloutRow key={callout.ref_number} callout={callout} section={section} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

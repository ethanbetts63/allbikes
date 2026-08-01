'use client';

import Link from 'next/link';
import Image from 'next/image';
import CalloutRow from '@/app/parts/new/sym/[modelSlug]/[sectionId]/_components/CalloutRow';
import EquivalentSections from '@/app/parts/_components/EquivalentSections';
import HowPartsLookupWorks from '@/app/parts/_components/HowPartsLookupWorks';
import type { SectionDetail } from '@/types/parts';

/** Exploded diagram beside its callout list, for one model section. */
export default function SectionDiagramView({ section }: { section: SectionDetail }) {
  const sectionLabel = section.name.toUpperCase().startsWith(section.code.toUpperCase())
    ? section.name
    : `${section.code} ${section.name}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-600">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/parts/new/sym" className="hover:underline">
          New SYM Parts
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/parts/new/sym/${section.model.slug}`} className="hover:underline">
          {section.model.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-black">{section.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:sticky lg:top-[8.25rem] lg:self-start">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <h1 className="text-xl font-bold text-black">{sectionLabel}</h1>
              <p className="text-sm text-gray-500">{section.model.name}</p>
              <EquivalentSections sections={section.equivalent_sections} className="mt-2" />
            </div>

            {section.diagram_image ? (
              <div className="overflow-auto p-2">
                <Image
                  src={section.diagram_image}
                  alt={`${section.name} exploded diagram`}
                  width={800}
                  height={600}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                  className="mx-auto h-auto w-full"
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-500">
                Diagram not available — use the parts list.
              </div>
            )}
          </div>
        </div>

        <div>
          <ul className="rounded-lg border border-gray-200 bg-white px-4">
            {section.callouts.map((callout) => (
              <CalloutRow key={callout.ref_number} callout={callout} section={section} />
            ))}
          </ul>
        </div>
      </div>
      <HowPartsLookupWorks />
    </div>
  );
}

'use client';

import CalloutRow from '@/app/parts/new/sym/[modelSlug]/[sectionId]/_components/CalloutRow';
import type { SectionDetail } from '@/types/parts';

/** The only interactive portion of a diagram page: colour selection and cart controls. */
export default function CalloutList({ section }: { section: SectionDetail }) {
  return (
    <ul className="rounded-lg border border-gray-200 bg-white px-4">
      {section.callouts.map((callout) => (
        <CalloutRow key={callout.ref_number} callout={callout} section={section} />
      ))}
    </ul>
  );
}

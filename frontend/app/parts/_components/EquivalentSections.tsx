'use client';

import Link from 'next/link';
import OverlapDisclosure from '@/app/parts/_components/OverlapDisclosure';
import { symPartsSectionPath } from '@/app/parts/_lib/routes';
import type { EquivalentSection } from '@/types/parts';

/** Diagrams in other books listing exactly the same parts.
 *
 *  Only exact matches appear. A larger diagram that merely happens to contain
 *  these parts is not interchangeable, so surfacing it would invite an order
 *  from the wrong book. It is a statement about printed part numbers, not
 *  fitment. */
export default function EquivalentSections({
  sections = [],
  className = '',
}: {
  // Optional: a payload cached before this field existed simply has none.
  sections?: EquivalentSection[];
  className?: string;
}) {
  if (sections.length === 0) return null;

  return (
    <OverlapDisclosure
      className={className}
      summary={`Identical to ${sections.length} diagram${sections.length === 1 ? '' : 's'} on other models`}
    >
      <ul className="space-y-1">
        {sections.map((s) => (
          <li key={`${s.model_slug}-${s.section_code}`} className="text-xs leading-relaxed">
            <Link
              href={symPartsSectionPath(s.model_slug, s.section_code)}
              className="text-gray-700 underline hover:text-black"
            >
              {s.model_name} <span className="font-mono text-gray-500">{s.model_code}</span>
              {' — '}
              <span className="font-mono">{s.section_code}</span> {s.section_name}
            </Link>
            <span className="ml-1 text-gray-500">· same parts</span>
          </li>
        ))}
      </ul>
    </OverlapDisclosure>
  );
}

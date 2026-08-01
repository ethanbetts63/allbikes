'use client';

import Link from 'next/link';
import type { EquivalentSection } from '@/types/parts';

/** Diagrams in other books carrying the same parts.
 *
 *  Around 16% of sections have one. For a customer unsure which book their
 *  bike takes, an identical diagram means the choice makes no difference for
 *  this section. It is a statement about printed part numbers, not fitment. */
export default function EquivalentSections({
  sections = [],
  className = '',
}: {
  // Optional: a payload cached before this field existed simply has none.
  sections?: EquivalentSection[];
  className?: string;
}) {
  if (sections.length === 0) return null;

  const identical = sections.filter((s) => s.relation === 'identical');
  const summary =
    identical.length > 0
      ? `Identical to ${identical.length} diagram${identical.length === 1 ? '' : 's'} on other models`
      : `All these parts also appear on ${sections.length} other model${sections.length === 1 ? '' : 's'}`;

  return (
    <details className={`group ${className}`}>
      <summary className="cursor-pointer list-none text-xs text-gray-500 underline decoration-dotted underline-offset-2 hover:text-black">
        {summary}
        <span className="ml-1 inline-block transition group-open:rotate-90">›</span>
      </summary>
      <ul className="mt-1.5 space-y-1 rounded-md bg-gray-50 px-2.5 py-2">
        {sections.map((s) => (
          <li key={`${s.model_slug}-${s.section_code}`} className="text-xs leading-relaxed">
            <Link
              href={`/parts/new/sym/${s.model_slug}/${s.section_code}`}
              className="text-gray-700 underline hover:text-black"
            >
              {s.model_name} <span className="font-mono text-gray-500">{s.model_code}</span>
              {' — '}
              <span className="font-mono">{s.section_code}</span> {s.section_name}
            </Link>
            <span className="ml-1 text-gray-500">
              {s.relation === 'identical'
                ? '· same parts'
                : `· contains all of these, plus more (${s.part_count})`}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

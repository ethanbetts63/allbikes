import Link from 'next/link';

import type { SearchPartResult } from '@/types/parts';
import { symPartsSectionPath } from '@/app/parts/_lib/routes';

/**
 * One matched part. Links to the first diagram it appears on; a part with no
 * section has nowhere to go, so it renders unlinked.
 */
export default function PartResultRow({ part }: { part: SearchPartResult }) {
  const target = part.sections[0];
  const inner = (
    <div className="flex flex-wrap items-center justify-between gap-2 p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-black">{part.part_number}</span>
          {part.colour_name && (
            <span className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-700">
              {part.colour_name}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600">{part.description}</div>
        {target && (
          <div className="text-xs text-gray-500">
            {target.model_name} · {target.section_name} · #{target.ref_number}
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold text-black">
          {part.price ? `$${part.price}` : part.orderable ? '—' : 'Not available'}
        </div>
        {target && <div className="text-xs text-gray-500">View diagram →</div>}
      </div>
    </div>
  );

  if (!target) return <li>{inner}</li>;

  return (
    <li>
      <Link
        href={symPartsSectionPath(target.model_slug, target.section_code, target.section_name)}
        className="block hover:bg-gray-50"
      >
        {inner}
      </Link>
    </li>
  );
}

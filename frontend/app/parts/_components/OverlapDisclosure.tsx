'use client';

import type { ReactNode } from 'react';

/** Collapsed "this is also used elsewhere" note.
 *
 *  Shared by the per-part list and the per-diagram note so the two read and
 *  behave identically. A native <details> keeps it keyboard-accessible and
 *  working without JavaScript. */
export default function OverlapDisclosure({
  summary,
  children,
  className = '',
}: {
  summary: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details className={`group ${className}`}>
      <summary className="cursor-pointer list-none text-xs text-[var(--highlight)] underline decoration-dotted underline-offset-2 hover:text-black">
        {summary}
        <span className="ml-1 inline-block transition group-open:rotate-90">›</span>
      </summary>
      <div className="mt-1.5 rounded-md bg-gray-50 px-2.5 py-2">{children}</div>
    </details>
  );
}

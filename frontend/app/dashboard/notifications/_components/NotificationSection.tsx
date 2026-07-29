/**
 * Heading + count shared by every notification group.
 *
 * Renders nothing when the count is zero, so the page can list sections
 * unconditionally and let each decide whether it has anything to say.
 */
export default function NotificationSection({ title, count, children }: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-3">
        {title} — {count}
      </h2>
      {children}
    </section>
  );
}

/** Shared shells so every group reads as the same kind of object. */
const PANEL = 'bg-[var(--bg-light-primary)] rounded-lg border border-border-light';
export const TABLE_PANEL = `${PANEL} overflow-hidden`;
export const LIST_PANEL = `${PANEL} divide-y divide-stone-100`;
export const ROW = 'hover:bg-[var(--bg-light-secondary)] cursor-pointer transition-colors';
export const HEAD_ROW =
  'border-b border-border-light text-xs text-[var(--text-dark-secondary)] uppercase tracking-wider';
export const TH = 'text-left px-4 py-3 font-semibold';
export const TD_MUTED = 'px-4 py-3 text-[var(--text-dark-secondary)]';

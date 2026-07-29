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

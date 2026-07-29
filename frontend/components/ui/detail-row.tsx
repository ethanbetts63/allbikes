/**
 * Label/value pair used down the admin detail panels.
 *
 * `labelWidth` exists because the panels genuinely differ: hire and booking
 * logs carry longer labels than orders and messages.
 */
export default function DetailRow({ label, value, labelWidth = 'w-36' }: {
  label: string;
  value: string;
  labelWidth?: string;
}) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
      <span className={`text-[var(--text-dark-primary)] font-semibold text-sm shrink-0 ${labelWidth}`}>
        {label}
      </span>
      <span className="text-[var(--text-dark-secondary)] text-sm text-right">{value}</span>
    </div>
  );
}

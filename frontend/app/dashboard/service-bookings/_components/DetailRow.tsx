/** Label/value pair used down the booking log detail panels. */
export default function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-[var(--text-dark-primary)] font-semibold text-sm w-40 shrink-0">{label}</span>
      <span className="text-[var(--text-dark-secondary)] text-sm text-right">{value}</span>
    </div>
  );
}

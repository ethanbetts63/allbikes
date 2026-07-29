/** One setting: name, what it does, and its control. */
export default function SettingRow({ title, detail, children }: {
  title: string;
  detail: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-1 block text-xs text-[var(--text-dark-secondary)]">{detail}</span>
      </span>
      {children}
    </label>
  );
}

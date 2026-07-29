import { Button } from '@/components/ui/button';
import type { HireExtra } from '@/types/HireBooking';

const TH = 'text-left px-4 py-3 font-semibold text-[var(--text-dark-secondary)] uppercase tracking-wide text-xs';

/** Defined extras. The status pill doubles as the active/inactive toggle. */
export default function HireExtrasTable({ extras, onToggleActive, onDelete }: {
  extras: HireExtra[];
  onToggleActive: (extra: HireExtra) => void;
  onDelete: (extra: HireExtra) => void;
}) {
  if (extras.length === 0) {
    return <p className="text-[var(--text-dark-secondary)] text-sm">No extras defined yet.</p>;
  }

  return (
    <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[var(--bg-light-secondary)] border-b border-[var(--border-light)]">
          <tr>
            <th className={TH}>Name</th>
            <th className={TH}>Price / Day</th>
            <th className={TH}>Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {extras.map(extra => (
            <tr key={extra.id} className="border-b border-[var(--border-light)] last:border-0">
              <td className="px-4 py-3 text-[var(--text-dark-primary)] font-medium">{extra.name}</td>
              <td className="px-4 py-3 text-[var(--text-dark-primary)]">
                ${parseFloat(extra.price_per_day).toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onToggleActive(extra)}
                  className={`text-xs font-semibold px-2 py-1 rounded-full border transition-colors ${
                    extra.is_active
                      ? 'border-green-600 text-green-700 hover:bg-red-50 hover:border-red-500 hover:text-destructive'
                      : 'border-gray-400 text-[var(--text-dark-secondary)] hover:border-green-600 hover:text-green-700'
                  }`}
                >
                  {extra.is_active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="destructive" size="sm" onClick={() => onDelete(extra)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

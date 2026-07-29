import { Input } from '@/components/ui/input';
import SettingRow from './SettingRow';
import { NUMERIC_FIELDS, type PartsSettings } from '../_lib/partsSettings';

/** Every parts setting an operator can change. */
export default function PartsSettingsForm({ settings, onChange }: {
  settings: PartsSettings;
  onChange: (settings: PartsSettings) => void;
}) {
  return (
    <div className="mt-6 divide-y divide-border-light rounded-md border border-border-light">
      <SettingRow
        title="Enable new parts sales"
        detail="When off, customers can browse diagrams but cannot add SYM parts or complete checkout."
      >
        <input
          type="checkbox"
          checked={settings.enable_new_part_sales}
          onChange={(e) => onChange({ ...settings, enable_new_part_sales: e.target.checked })}
          className="h-5 w-5"
          aria-label="Enable new parts sales"
        />
      </SettingRow>

      <SettingRow
        title="Backorder hold period"
        detail="Number of days to wait for supplier stock before refunding unavailable items."
      >
        <Input
          type="number"
          min="1"
          max="90"
          step="1"
          value={settings.backorder_hold_days}
          onChange={(e) => onChange({ ...settings, backorder_hold_days: Number(e.target.value) })}
          className="w-28 text-right"
          aria-label="Backorder hold period in days"
        />
      </SettingRow>

      {NUMERIC_FIELDS.map(({ key, title, detail, prefix, suffix }) => (
        <SettingRow key={key} title={title} detail={detail}>
          <span className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-dark-secondary)]">{prefix}</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={settings[key]}
              onChange={(e) => onChange({ ...settings, [key]: e.target.value })}
              className="w-28 text-right"
              aria-label={title}
            />
            <span className="w-4 text-sm text-[var(--text-dark-secondary)]">{suffix}</span>
          </span>
        </SettingRow>
      ))}
    </div>
  );
}

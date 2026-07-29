import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { HireSettings } from '@/types/HireBooking';
import SettingsNumberField from './SettingsNumberField';

/**
 * The fields, in display order. `decimal` fields keep their string value so
 * money isn't rounded through parseInt; everything else is a whole number.
 */
const FIELDS: { key: keyof HireSettings; label: string; decimal?: boolean }[] = [
  { key: 'bond_amount', label: 'Bond Amount (AUD)', decimal: true },
  { key: 'advance_min_days', label: 'Min Advance Days' },
  { key: 'advance_max_days', label: 'Max Advance Days' },
  { key: 'minimum_age', label: 'Minimum Hire Age' },
  { key: 'booking_gap_days', label: 'Booking Gap Days' },
  { key: 'weekly_discount_percent', label: 'Weekly Discount (%)' },
  { key: 'monthly_discount_percent', label: 'Monthly Discount (%)' },
];

export default function HireSettingsForm({ settings, isSaving, onChange, onSave }: {
  settings: HireSettings;
  isSaving: boolean;
  onChange: (settings: HireSettings) => void;
  onSave: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {FIELDS.map(({ key, label, decimal }) => (
            <SettingsNumberField
              key={key}
              id={key}
              label={label}
              step={decimal ? '0.01' : undefined}
              value={settings[key] as string | number}
              onChange={(raw) =>
                onChange({ ...settings, [key]: decimal ? raw : parseInt(raw) })}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
}

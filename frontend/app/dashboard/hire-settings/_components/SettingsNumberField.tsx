import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** One labelled numeric setting. */
export default function SettingsNumberField({ id, label, value, step, onChange }: {
  id: string;
  label: string;
  value: string | number;
  /** Set for decimal settings such as the bond amount. */
  step?: string;
  onChange: (raw: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

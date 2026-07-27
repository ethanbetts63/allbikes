'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { authedFetch } from '@/apiClient';

interface PartsSettings {
  markup_percentage: string;
  domestic_shipping_fee: string;
  international_shipping_fee: string;
  enable_new_part_sales: boolean;
  backorder_hold_days: number;
  updated_at: string;
}

type EditableField = 'markup_percentage' | 'domestic_shipping_fee' | 'international_shipping_fee';

const fields: Array<{ key: EditableField; title: string; detail: string; prefix?: string; suffix?: string }> = [
  { key: 'markup_percentage', title: 'Markup percentage', detail: 'Added to the supplier price to calculate the customer part price.', suffix: '%' },
  { key: 'domestic_shipping_fee', title: 'Domestic shipping', detail: 'Flat shipping fee for Australian delivery addresses.', prefix: '$' },
  { key: 'international_shipping_fee', title: 'International shipping', detail: 'Flat shipping fee for delivery addresses outside Australia.', prefix: '$' },
];

export default function PartsSettingsPage() {
  const [settings, setSettings] = useState<PartsSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<PartsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    authedFetch('/api/parts/admin/settings/')
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load parts settings.');
        return response.json() as Promise<PartsSettings>;
      })
      .then((data) => { setSettings(data); setSavedSettings(data); })
      .catch((error: Error) => setMessage({ text: error.message, error: true }))
      .finally(() => setLoading(false));
  }, []);

  const setField = (key: EditableField, value: string) => {
    setSettings((current) => current ? { ...current, [key]: value } : current);
    setMessage(null);
  };

  const save = async () => {
    if (!settings) return;
    const values = fields.map(({ key }) => Number(settings[key]));
    if (values.some((value) => !Number.isFinite(value) || value < 0)) {
      setMessage({ text: 'Enter valid amounts of $0 or more.', error: true });
      return;
    }
    setSaving(true); setMessage(null);
    try {
      const response = await authedFetch('/api/parts/admin/settings/', {
        method: 'PATCH',
        body: JSON.stringify({
          markup_percentage: Number(settings.markup_percentage).toFixed(2),
          domestic_shipping_fee: Number(settings.domestic_shipping_fee).toFixed(2),
          international_shipping_fee: Number(settings.international_shipping_fee).toFixed(2),
          enable_new_part_sales: settings.enable_new_part_sales,
          backorder_hold_days: settings.backorder_hold_days,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Failed to save parts settings.');
      setSettings(data); setSavedSettings(data); setMessage({ text: 'Parts settings saved.' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Failed to save parts settings.', error: true });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner className="h-12 w-12" /></div>;
  if (!settings) return <p className="p-6 text-destructive">Unable to load parts settings.</p>;
  const isDirty = !savedSettings
    || fields.some(({ key }) => settings[key] !== savedSettings[key])
    || settings.enable_new_part_sales !== savedSettings.enable_new_part_sales
    || settings.backorder_hold_days !== savedSettings.backorder_hold_days;

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-lg bg-[var(--bg-light-primary)] p-4 text-[var(--text-dark-primary)] md:p-6">
        <h1 className="text-2xl font-bold">Parts Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-dark-secondary)]">Set the customer markup and flat shipping charged at parts checkout.</p>
        {message && <Alert variant={message.error ? 'destructive' : 'default'} className="mt-5"><AlertDescription>{message.text}</AlertDescription></Alert>}
        <div className="mt-6 divide-y divide-border-light rounded-md border border-border-light">
          <label className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span><span className="block text-sm font-bold">Enable new parts sales</span><span className="mt-1 block text-xs text-[var(--text-dark-secondary)]">When off, customers can browse diagrams but cannot add SYM parts or complete checkout.</span></span>
            <input
              type="checkbox"
              checked={settings.enable_new_part_sales}
              onChange={(event) => setSettings((current) => current ? { ...current, enable_new_part_sales: event.target.checked } : current)}
              className="h-5 w-5"
              aria-label="Enable new parts sales"
            />
          </label>
          <label className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <span><span className="block text-sm font-bold">Backorder hold period</span><span className="mt-1 block text-xs text-[var(--text-dark-secondary)]">Number of days to wait for supplier stock before refunding unavailable items.</span></span>
            <Input type="number" min="1" max="90" step="1" value={settings.backorder_hold_days} onChange={(event) => setSettings((current) => current ? { ...current, backorder_hold_days: Number(event.target.value) } : current)} className="w-28 text-right" aria-label="Backorder hold period in days" />
          </label>
          {fields.map(({ key, title, detail, prefix, suffix }) => (
            <label key={key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <span><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-xs text-[var(--text-dark-secondary)]">{detail}</span></span>
              <span className="flex items-center gap-2"><span className="text-sm text-[var(--text-dark-secondary)]">{prefix}</span><Input type="number" min="0" step="0.01" value={settings[key]} onChange={(event) => setField(key, event.target.value)} className="w-28 text-right" aria-label={title} /><span className="w-4 text-sm text-[var(--text-dark-secondary)]">{suffix}</span></span>
            </label>
          ))}
        </div>
        <section className="mt-8 border-t border-border-light pt-6">
          <h2 className="text-lg font-bold">How it works</h2>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-[var(--text-dark-secondary)]">
            <li>Each day, the system imports the latest SYM price and availability data from Select Portal.</li>
            <li>Customers choose their model, section and exploded diagram, then add the required parts to their cart.</li>
            <li>At checkout, the customer price is Select Portal&apos;s base price plus our markup and domestic or international shipping.</li>
            <li>Admin receives an email and SMS for each paid order. Find it in Parts Orders, review it, choose <strong>Email supplier</strong>, check the draft and send it to Select Scooters.</li>
            <li>Select Scooters should fulfil only complete orders. If anything is unavailable, they should email us with the missing parts and expected restock date.</li>
            <li>If one or more items go on backorder, mark those items and use <strong>Email backorder update</strong> to send the customer a full line-by-line update.</li>
            <li>Admin then marks affected items as backordered or refunded, depending on whether the order can be fulfilled within the {settings.backorder_hold_days}-day backorder window. Only use <strong>Email refund update</strong> after the relevant Stripe refund has been processed.</li>
            <li>When the order has been arranged with the supplier, use <strong>Email order arranged</strong> to tell the customer their complete order has been arranged for shipment.</li>
            <li><strong>Planned next:</strong> admin will receive email and SMS reminders when an order exceeds that backorder window. Admin must then remove unavailable items and process the appropriate partial or full Stripe refund.</li>
          </ol>
        </section>
        <div className="mt-5 flex items-center justify-between gap-3"><p className="text-xs text-[var(--text-dark-secondary)]">Changes apply to new checkouts immediately.</p><Button onClick={save} disabled={!isDirty || saving}>{saving ? 'Saving…' : 'Save settings'}</Button></div>
      </div>
    </div>
  );
}

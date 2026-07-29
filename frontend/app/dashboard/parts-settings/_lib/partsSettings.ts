import type { PartsSettings } from '@/app/dashboard/_lib/partsSettings';

export type { PartsSettings } from '@/app/dashboard/_lib/partsSettings';

/** The two money/percentage fields, which share a control shape. */
export type EditableField = 'markup_percentage' | 'shipping_fee';

export const NUMERIC_FIELDS: Array<{
  key: EditableField;
  title: string;
  detail: string;
  prefix?: string;
  suffix?: string;
}> = [
  {
    key: 'markup_percentage',
    title: 'Markup percentage',
    detail: 'Added to the supplier price to calculate the customer part price.',
    suffix: '%',
  },
  {
    key: 'shipping_fee',
    title: 'Shipping fee',
    detail: 'Flat shipping fee for Australian delivery addresses.',
    prefix: '$',
  },
];

export const settingsAreDirty = (current: PartsSettings, saved: PartsSettings | null) =>
  !saved
  || NUMERIC_FIELDS.some(({ key }) => current[key] !== saved[key])
  || current.enable_new_part_sales !== saved.enable_new_part_sales
  || current.backorder_hold_days !== saved.backorder_hold_days;

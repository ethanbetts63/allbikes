'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { usePartsCart } from '@/context/PartsCartContext';
import type { Callout, PartVariant, SectionDetail } from '@/types/parts';

interface Props {
  callout: Callout;
  section: SectionDetail;
}

export default function CalloutRow({ callout, section }: Props) {
  // For colour callouts, one row with a colour selector. For date/none, list each variant.
  if (callout.variant_axis === 'colour') {
    return <ColourCallout callout={callout} section={section} />;
  }
  return (
    <li className="border-b border-gray-100 py-3">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
          {callout.ref_number}
        </span>
        <span className="font-medium text-black">{callout.callout_label}</span>
      </div>
      <div className="space-y-2 pl-8">
        {callout.variants.map((v) => (
          <VariantLine
            key={v.part_number}
            variant={v}
            section={section}
            callout={callout}
            showLabel={callout.variant_axis === 'date'}
          />
        ))}
      </div>
    </li>
  );
}

function ColourCallout({ callout, section }: Props) {
  const [index, setIndex] = useState(0);
  const variant = callout.variants[index];
  return (
    <li className="border-b border-gray-100 py-3">
      <div className="mb-1 flex items-baseline gap-2">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
          {callout.ref_number}
        </span>
        <span className="font-medium text-black">{callout.callout_label}</span>
      </div>
      <div className="pl-8">
        <label className="mb-2 block text-xs text-gray-600">
          Colour — pick the one matching your bike. Unsure of the code? We&apos;ll confirm before dispatch.
        </label>
        <select
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="mb-2 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black"
        >
          {callout.variants.map((v, i) => (
            <option key={v.part_number} value={i}>
              {v.variant_label}
              {v.paint_code ? ` (${v.paint_code})` : ''}
              {v.orderable ? '' : ' — not available'}
            </option>
          ))}
        </select>
        <VariantLine variant={variant} section={section} callout={callout} showLabel={false} />
      </div>
    </li>
  );
}

function VariantLine({
  variant,
  section,
  callout,
  showLabel,
}: {
  variant: PartVariant;
  section: SectionDetail;
  callout: Callout;
  showLabel: boolean;
}) {
  const { addItem } = usePartsCart();

  const add = () => {
    if (!variant.price) return;
    addItem({
      part_number: variant.part_number,
      description: variant.description,
      colour_name: variant.colour_name,
      model_name: section.model.name,
      model_code: section.model.model_code,
      section_code: section.code,
      ref_number: callout.ref_number,
      unit_price: variant.price,
      quantity: 1,
      backorder: variant.backorder,
    });
    toast.success(`Added ${variant.part_number} to cart`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-black">{variant.part_number}</span>
          {showLabel && variant.variant_label && (
            <span className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-700">
              {variant.variant_label}
            </span>
          )}
        </div>
        <div className="text-xs">
          {variant.orderable ? (
            variant.backorder ? (
              <span className="font-medium text-black">Backorder — ships when restocked</span>
            ) : (
              <span className="text-gray-600">In stock</span>
            )
          ) : (
            <span className="text-gray-400">Not available</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-black">
          {variant.price ? `$${variant.price}` : '—'}
        </span>
        <button
          type="button"
          onClick={add}
          disabled={!variant.orderable}
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          Add
        </button>
      </div>
    </div>
  );
}

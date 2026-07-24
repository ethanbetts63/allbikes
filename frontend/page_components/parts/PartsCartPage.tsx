'use client';

import Link from 'next/link';
import { usePartsCart } from '@/context/PartsCartContext';

export default function PartsCartPage() {
  const { items, subtotal, updateQuantity, removeItem } = usePartsCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Your parts cart is empty</h1>
        <Link
          href="/parts"
          className="mt-4 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Browse parts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Your parts cart</h1>

      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {items.map((item) => (
          <li key={item.part_number} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gray-800">{item.part_number}</span>
                {item.colour_name && (
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                    {item.colour_name}
                  </span>
                )}
                {item.backorder && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">
                    Backorder
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500">{item.description}</div>
              <div className="text-xs text-gray-400">
                {item.model_name} · {item.section_code} · #{item.ref_number}
              </div>
            </div>

            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => updateQuantity(item.part_number, Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm"
              aria-label={`Quantity for ${item.part_number}`}
            />
            <div className="w-20 text-right text-sm font-semibold text-gray-900">
              ${(Number(item.unit_price) * item.quantity).toFixed(2)}
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.part_number)}
              className="text-sm text-gray-400 hover:text-red-600"
              aria-label={`Remove ${item.part_number}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-900">
          Subtotal: ${subtotal.toFixed(2)} <span className="text-sm font-normal text-gray-500">incl. GST</span>
        </span>
        <button
          type="button"
          disabled
          title="Checkout is being finalised"
          className="cursor-not-allowed rounded-md bg-gray-300 px-5 py-2.5 text-sm font-medium text-white"
        >
          Checkout (coming soon)
        </button>
      </div>
      <p className="mt-2 text-right text-xs text-gray-400">
        Shipping is calculated at checkout. Backordered items ship when restocked.
      </p>
    </div>
  );
}

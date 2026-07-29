'use client';

import Link from 'next/link';

import { partsCartItemKey, usePartsCart } from '@/context/PartsCartContext';
import { stockState } from '@/lib/partsStock';
import QuantityControl from '@/components/parts/QuantityControl';
import CartLineRow from './CartLineRow';

export default function PartsCartScreen() {
  const { items, subtotal, updateQuantity, removeItem } = usePartsCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-black">Your parts cart is empty</h1>
        <Link
          href="/parts/new/sym"
          className="mt-4 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Browse parts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-black">Your parts cart</h1>

      <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {items.map((item) => (
          <CartLineRow
            key={partsCartItemKey(item)}
            item={item}
            stock={stockState(item.available_qty, item.quantity)}
            control={
              <QuantityControl
                partNumber={item.part_number}
                quantity={item.quantity}
                onChange={(quantity) => updateQuantity(partsCartItemKey(item), quantity)}
              />
            }
            onRemove={() => removeItem(partsCartItemKey(item))}
          />
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-lg font-semibold text-black">
          Subtotal: ${subtotal.toFixed(2)}{' '}
          <span className="text-sm font-normal text-gray-600">incl. GST</span>
        </span>
        <Link
          href="/parts/checkout"
          className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Checkout
        </Link>
      </div>
      <p className="mt-2 text-right text-xs text-gray-500">
        Shipping is calculated at checkout. Out-of-stock items can be ordered on backorder.
      </p>
    </div>
  );
}

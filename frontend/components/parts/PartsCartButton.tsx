'use client';

import Link from 'next/link';
import { usePartsCart } from '@/context/PartsCartContext';

export default function PartsCartButton() {
  const { count, subtotal } = usePartsCart();
  return (
    <Link
      href="/parts/cart"
      className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
    >
      <span>Cart</span>
      <span className="inline-flex min-w-[1.5rem] justify-center rounded-full bg-white/20 px-2 text-xs">
        {count}
      </span>
      {subtotal > 0 && <span className="hidden sm:inline">${subtotal.toFixed(2)}</span>}
    </Link>
  );
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PartsCartItem } from '@/types/parts';

const STORAGE_KEY = 'parts_cart_v1';

interface PartsCartContextValue {
  items: PartsCartItem[];
  count: number;
  subtotal: number;
  addItem: (item: PartsCartItem) => void;
  updateQuantity: (partNumber: string, quantity: number) => void;
  removeItem: (partNumber: string) => void;
  clear: () => void;
}

const PartsCartContext = createContext<PartsCartContextValue | null>(null);

function loadItems(): PartsCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PartsCartItem[]) : [];
  } catch {
    return [];
  }
}

export function PartsCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<PartsCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: PartsCartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.part_number === item.part_number);
      if (existing) {
        return prev.map((i) =>
          i.part_number === item.part_number
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        );
      }
      return [...prev, item];
    });
  }, []);

  const updateQuantity = useCallback((partNumber: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.part_number === partNumber ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((partNumber: string) => {
    setItems((prev) => prev.filter((i) => i.part_number !== partNumber));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<PartsCartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + Number(i.unit_price) * i.quantity, 0);
    return { items, count, subtotal, addItem, updateQuantity, removeItem, clear };
  }, [items, addItem, updateQuantity, removeItem, clear]);

  return <PartsCartContext.Provider value={value}>{children}</PartsCartContext.Provider>;
}

export function usePartsCart(): PartsCartContextValue {
  const ctx = useContext(PartsCartContext);
  if (!ctx) {
    throw new Error('usePartsCart must be used within a PartsCartProvider');
  }
  return ctx;
}

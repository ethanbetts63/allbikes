'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PartsCartItem } from '@/types/parts';

const STORAGE_KEY = 'parts_cart_v1';

interface PartsCartContextValue {
  items: PartsCartItem[];
  count: number;
  subtotal: number;
  addItem: (item: PartsCartItem) => void;
  updateQuantity: (itemKey: string, quantity: number) => void;
  removeItem: (itemKey: string) => void;
  clear: () => void;
}

const PartsCartContext = createContext<PartsCartContextValue | null>(null);

export function partsCartItemKey(item: Pick<PartsCartItem, 'fitment_key' | 'part_number'>): string {
  return item.fitment_key ?? item.part_number;
}

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
    const timeoutId = window.setTimeout(() => {
      setItems(loadItems());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: PartsCartItem) => {
    setItems((prev) => {
      const itemKey = partsCartItemKey(item);
      const existing = prev.find((i) => partsCartItemKey(i) === itemKey);
      if (existing) {
        return prev.map((i) =>
          partsCartItemKey(i) === itemKey
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        );
      }
      return [...prev, item];
    });
  }, []);

  const updateQuantity = useCallback((itemKey: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (partsCartItemKey(i) === itemKey ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((itemKey: string) => {
    setItems((prev) => prev.filter((i) => partsCartItemKey(i) !== itemKey));
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

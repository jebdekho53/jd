'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { BuyerProduct, BuyerProductWithStore } from '@/types/buyer';

const STORAGE_KEY = 'jebdekho-recently-viewed';
const MAX_ITEMS = 12;

export interface RecentlyViewedItem {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  unit: string;
  storeName?: string;
  storeSlug?: string;
  viewedAt: number;
}

const EMPTY: RecentlyViewedItem[] = [];

let cachedRaw: string | null = null;
let cachedSnapshot: RecentlyViewedItem[] = EMPTY;

function readStorage(): RecentlyViewedItem[] {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '[]';
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    cachedSnapshot = JSON.parse(raw) as RecentlyViewedItem[];
    return cachedSnapshot;
  } catch {
    return EMPTY;
  }
}

let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

function writeStorage(items: RecentlyViewedItem[]) {
  const raw = JSON.stringify(items);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = items;
  emit();
}

function getDisplayPrice(product: BuyerProduct | BuyerProductWithStore): number {
  const variant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  return variant?.price ?? product.basePrice;
}

export function useRecentlyViewed() {
  const items = useSyncExternalStore(subscribe, readStorage, () => EMPTY);

  const addItem = useCallback(
    (product: BuyerProduct | BuyerProductWithStore, store?: { name: string; slug: string }) => {
      const entry: RecentlyViewedItem = {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrls[0] ?? null,
        price: getDisplayPrice(product),
        unit: product.unit,
        storeName: store?.name ?? ('store' in product ? product.store.name : undefined),
        storeSlug: store?.slug ?? ('store' in product ? product.store.slug : undefined),
        viewedAt: Date.now(),
      };

      const current = readStorage();
      const existing = current.find((i) => i.id === entry.id);
      if (
        existing &&
        existing.viewedAt === entry.viewedAt &&
        existing.price === entry.price
      ) {
        return;
      }

      const next = [entry, ...current.filter((i) => i.id !== entry.id)].slice(0, MAX_ITEMS);
      writeStorage(next);
    },
    [],
  );

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedSnapshot = EMPTY;
    emit();
  }, []);

  return { items, addItem, clear };
}

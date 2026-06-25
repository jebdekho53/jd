'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { BuyerProduct, BuyerProductWithStore } from '@/types/buyer';

const STORAGE_KEY = 'jebdekho-wishlist';
const MAX = 50;

export interface WishlistItem {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  unit: string;
  storeId?: string;
  storeName?: string;
  storeSlug?: string;
  addedAt: number;
}

const EMPTY: WishlistItem[] = [];
let cachedRaw: string | null = null;
let cachedSnapshot: WishlistItem[] = EMPTY;

function readStorage(): WishlistItem[] {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '[]';
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    cachedSnapshot = JSON.parse(raw) as WishlistItem[];
    return cachedSnapshot;
  } catch {
    return EMPTY;
  }
}

let listeners: Array<() => void> = [];

function subscribe(l: () => void) {
  listeners = [...listeners, l];
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

function emit() {
  listeners.forEach((fn) => fn());
}

function writeStorage(items: WishlistItem[]) {
  const raw = JSON.stringify(items);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = items;
  emit();
}

function getPrice(product: BuyerProduct | BuyerProductWithStore): number {
  const v = product.variants.find((x) => x.isDefault) ?? product.variants[0];
  return v?.price ?? product.basePrice;
}

export function useWishlist() {
  const items = useSyncExternalStore(subscribe, readStorage, () => EMPTY);

  const isWishlisted = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items],
  );

  const toggle = useCallback((product: BuyerProduct | BuyerProductWithStore) => {
    const store = 'store' in product ? product.store : undefined;
    const current = readStorage();
    const exists = current.find((i) => i.id === product.id);
    if (exists) {
      writeStorage(current.filter((i) => i.id !== product.id));
      return false;
    }
    const entry: WishlistItem = {
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrls[0] ?? null,
      price: getPrice(product),
      unit: product.unit,
      storeId: store?.id,
      storeName: store?.name,
      storeSlug: store?.slug,
      addedAt: Date.now(),
    };
    writeStorage([entry, ...current.filter((i) => i.id !== product.id)].slice(0, MAX));
    return true;
  }, []);

  const remove = useCallback((id: string) => {
    writeStorage(readStorage().filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedSnapshot = EMPTY;
    emit();
  }, []);

  return { items, isWishlisted, toggle, remove, clear };
}

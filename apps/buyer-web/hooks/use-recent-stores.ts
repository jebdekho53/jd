'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { PWA_RECENT_STORES_KEY } from '@/lib/pwa/constants';

const MAX = 8;
const EMPTY: RecentStore[] = [];

export interface RecentStore {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  viewedAt: number;
}

let cachedRaw: string | null = null;
let cachedSnapshot: RecentStore[] = EMPTY;
let listeners: Array<() => void> = [];

function readStorage(): RecentStore[] {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(PWA_RECENT_STORES_KEY) ?? '[]';
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    cachedSnapshot = JSON.parse(raw) as RecentStore[];
    return cachedSnapshot;
  } catch {
    return EMPTY;
  }
}

function subscribe(l: () => void) {
  listeners = [...listeners, l];
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function trackRecentStore(store: Omit<RecentStore, 'viewedAt'>) {
  const entry: RecentStore = { ...store, viewedAt: Date.now() };
  const current = readStorage();
  const next = [entry, ...current.filter((s) => s.id !== store.id)].slice(0, MAX);
  const raw = JSON.stringify(next);
  localStorage.setItem(PWA_RECENT_STORES_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = next;
  emit();
}

export function useRecentStores() {
  const items = useSyncExternalStore(subscribe, readStorage, () => EMPTY);
  const clear = useCallback(() => {
    localStorage.removeItem(PWA_RECENT_STORES_KEY);
    cachedRaw = null;
    cachedSnapshot = EMPTY;
    emit();
  }, []);
  return { items, clear };
}

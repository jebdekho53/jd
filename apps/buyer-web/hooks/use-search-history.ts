'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'jebdekho-search-history';
const MAX = 8;
const EMPTY: string[] = [];

let cachedRaw: string | null = null;
let cachedSnapshot: string[] = EMPTY;

function readStorage(): string[] {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? '[]';
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    cachedSnapshot = JSON.parse(raw) as string[];
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
  listeners.forEach((l) => l());
}

function writeStorage(items: string[]) {
  const raw = JSON.stringify(items);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = items;
  emit();
}

export function useSearchHistory() {
  const items = useSyncExternalStore(subscribe, readStorage, () => EMPTY);

  const add = useCallback((query: string) => {
    const q = query.trim();
    if (q.length < 2) return;
    const current = readStorage();
    if (current[0]?.toLowerCase() === q.toLowerCase()) return;
    const next = [q, ...current.filter((i) => i.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
    writeStorage(next);
  }, []);

  const remove = useCallback((query: string) => {
    const next = readStorage().filter((i) => i !== query);
    writeStorage(next);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    cachedRaw = null;
    cachedSnapshot = EMPTY;
    emit();
  }, []);

  return { items, add, remove, clear };
}

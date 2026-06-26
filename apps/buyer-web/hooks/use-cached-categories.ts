import { PWA_CACHED_CATEGORIES_KEY } from '@/lib/pwa/constants';

export interface CachedCategory {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

export function cacheCategories(categories: CachedCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PWA_CACHED_CATEGORIES_KEY, JSON.stringify(categories.slice(0, 24)));
  } catch {
    /* quota */
  }
}

export function readCachedCategories(): CachedCategory[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PWA_CACHED_CATEGORIES_KEY);
    return raw ? (JSON.parse(raw) as CachedCategory[]) : [];
  } catch {
    return [];
  }
}

export function useCachedCategoriesSnapshot(): CachedCategory[] {
  return readCachedCategories();
}

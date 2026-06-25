import type { WishlistItem } from '@/hooks/use-wishlist';

const STORAGE_KEY = 'jebdekho-wishlist';

export function getWishlistItems(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as WishlistItem[];
  } catch {
    return [];
  }
}

export async function fetchWishlist(): Promise<WishlistItem[]> {
  return getWishlistItems();
}

export async function removeWishlistItem(id: string): Promise<void> {
  const items = getWishlistItems().filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('wishlist-change'));
}

export async function clearWishlist(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('wishlist-change'));
}

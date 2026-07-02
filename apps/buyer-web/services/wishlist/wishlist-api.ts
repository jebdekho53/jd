import { buyerFetch } from '@/services/api/buyer-auth-client';

export interface ServerWishlistItem {
  id: string;
  productId: string;
  addedAt: string;
  name: string;
  unit: string;
  price: number;
  imageUrl: string | null;
  store: { id: string; name: string; slug: string } | null;
}

/** Fetch the server-persisted wishlist. Returns [] for guests / on error. */
export async function fetchServerWishlist(): Promise<ServerWishlistItem[]> {
  try {
    const res = await buyerFetch<{ success: boolean; data: ServerWishlistItem[] }>(
      '/api/buyer/wishlist',
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

/** Best-effort add. Swallows errors (e.g. 401 for guests) so UI state is unaffected. */
export async function addToServerWishlist(productId: string): Promise<void> {
  try {
    await buyerFetch('/api/buyer/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  } catch {
    /* guest or transient — local state remains source of truth */
  }
}

/** Best-effort remove. Swallows errors. */
export async function removeFromServerWishlist(productId: string): Promise<void> {
  try {
    await buyerFetch(`/api/buyer/wishlist/${encodeURIComponent(productId)}`, { method: 'DELETE' });
  } catch {
    /* guest or transient */
  }
}

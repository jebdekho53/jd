/** Mirrors WishlistService.list() in apps/api/src/modules/wishlist. */
export interface WishlistItem {
  /** The wishlist row id — note the API's DELETE takes the productId. */
  id: string;
  productId: string;
  addedAt: string;
  name: string;
  unit: string;
  price: number;
  imageUrl: string | null;
  store: { id: string; name: string; slug: string } | null;
}

import type { QueryClient } from '@tanstack/react-query';
import { addCartItem } from '@/services/cart/cart-api';
import { cartKeys } from '@/hooks/use-cart';
import { useGuestCartStore } from '@/store/guest-cart-store';

/**
 * After login, push local guest-cart lines to the server cart (same store only).
 */
export async function mergeGuestCartIntoServer(queryClient: QueryClient): Promise<void> {
  const { items, clear } = useGuestCartStore.getState();
  if (items.length === 0) return;

  try {
    for (const item of items) {
      await addCartItem({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }
    clear();
    await queryClient.invalidateQueries({ queryKey: cartKeys.current() });
  } catch {
    // Keep guest cart if merge fails (e.g. offline) so user does not lose items.
  }
}

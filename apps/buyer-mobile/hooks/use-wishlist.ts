import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addToWishlist, getWishlist, removeFromWishlist } from '@/services/buyer-api';
import type { WishlistItem } from '@/types/wishlist';

export const wishlistKeys = {
  list: ['wishlist', 'list'] as const,
};

/**
 * Unlike buyer-web — which keeps a localStorage wishlist so guests can save
 * items and syncs it up on login — every screen in this app sits behind the
 * auth guard, so the server list is the only source of truth.
 */
export function useWishlistQuery() {
  return useQuery({ queryKey: wishlistKeys.list, queryFn: getWishlist, staleTime: 30_000 });
}

export function useIsWishlisted(productId: string): boolean {
  const { data } = useWishlistQuery();
  return !!data?.some((item) => item.productId === productId);
}

export function useToggleWishlistMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, wishlisted }: { productId: string; wishlisted: boolean }) => {
      if (wishlisted) await removeFromWishlist(productId);
      else await addToWishlist(productId);
    },
    // Flip the heart immediately, then reconcile with the server list.
    onMutate: async ({ productId, wishlisted }) => {
      await qc.cancelQueries({ queryKey: wishlistKeys.list });
      const previous = qc.getQueryData<WishlistItem[]>(wishlistKeys.list);
      if (previous && wishlisted) {
        qc.setQueryData(
          wishlistKeys.list,
          previous.filter((item) => item.productId !== productId),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(wishlistKeys.list, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: wishlistKeys.list }),
  });
}

export function useRemoveWishlistItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => removeFromWishlist(productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: wishlistKeys.list }),
  });
}

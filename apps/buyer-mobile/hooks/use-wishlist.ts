import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addToWishlist, getWishlist, removeFromWishlist } from '@/services/buyer-api';
import { useIsAuthenticated } from '@/hooks/use-auth';
import type { WishlistItem } from '@/types/wishlist';

export const wishlistKeys = {
  list: ['wishlist', 'list'] as const,
};

/**
 * The server wishlist requires login (unlike buyer-web, which keeps a
 * localStorage wishlist for guests) — disabled here so a guest viewing a
 * product doesn't fire a doomed authenticated request. Guests are prompted
 * to sign in when they tap the wishlist heart instead.
 */
export function useWishlistQuery() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: wishlistKeys.list,
    queryFn: getWishlist,
    staleTime: 30_000,
    enabled: isAuthenticated,
  });
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

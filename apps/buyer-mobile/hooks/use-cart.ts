import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from '@/services/buyer-api';
import { useIsAuthenticated } from '@/hooks/use-auth';

export const cartKeys = {
  current: ['cart', 'current'] as const,
};

/** The server cart requires login — disabled for guests so product/home
 *  screens (guest-browsable) don't fire a doomed authenticated request.
 *  Guests use useGuestCartStore (store/guest-cart-store.ts) instead. */
export function useCartQuery() {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: cartKeys.current,
    queryFn: getCart,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
    enabled: isAuthenticated,
  });
}

export function useAddCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addCartItem,
    onSuccess: (cart) => qc.setQueryData(cartKeys.current, cart),
  });
}

export function useUpdateCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onSuccess: (cart) => qc.setQueryData(cartKeys.current, cart),
  });
}

export function useRemoveCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: (cart) => qc.setQueryData(cartKeys.current, cart),
  });
}

export function useClearCartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => qc.setQueryData(cartKeys.current, null),
  });
}

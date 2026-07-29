import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from '@/services/buyer-api';

export const cartKeys = {
  current: ['cart', 'current'] as const,
};

export function useCartQuery() {
  return useQuery({
    queryKey: cartKeys.current,
    queryFn: getCart,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
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

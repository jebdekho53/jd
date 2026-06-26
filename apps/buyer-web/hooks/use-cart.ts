'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '@/services/cart/cart-api';
import type { AddCartItemPayload, Cart } from '@/types/cart';
import { useAuthStore } from '@/store/auth-store';
import { useGuestCartStore } from '@/store/guest-cart-store';

export const cartKeys = {
  all: ['cart'] as const,
  current: () => [...cartKeys.all, 'current'] as const,
};

export function useCartQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: getCart,
    enabled: isAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });
}

/** Item count for header / floating bar — server cart when logged in, else guest cart. */
export function useCartItemCount(): number {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: cart } = useCartQuery();
  const guestCount = useGuestCartStore((s) => s.itemCount());
  if (isAuthenticated) return cart?.itemCount ?? 0;
  return guestCount;
}

export function useAddCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddCartItemPayload) => addCartItem(payload),
    onSuccess: (cart) => {
      qc.setQueryData(cartKeys.current(), cart);
    },
  });
}

export function useUpdateCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, { quantity }),
    onSuccess: (cart) => {
      qc.setQueryData(cartKeys.current(), cart);
    },
  });
}

export function useRemoveCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: (cart) => {
      qc.setQueryData(cartKeys.current(), cart);
    },
  });
}

export function useClearCartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      qc.setQueryData(cartKeys.current(), null);
    },
  });
}

/** Derived helper: total item count from cache */
export function useCartCount(): number {
  const qc = useQueryClient();
  const cart = qc.getQueryData<Cart | null>(cartKeys.current());
  return cart?.itemCount ?? 0;
}

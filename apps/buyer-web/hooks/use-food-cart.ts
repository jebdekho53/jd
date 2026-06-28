'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addFoodCartItem,
  clearFoodCart,
  foodKeys,
  getFoodCart,
  removeFoodCartItem,
  updateFoodCartItem,
} from '@/services/food/food-api';
import type { AddFoodCartItemPayload, FoodCart } from '@/types/food';
import { useAuthStore } from '@/store/auth-store';

export const foodCartKeys = {
  all: ['food-cart'] as const,
  current: () => [...foodCartKeys.all, 'current'] as const,
};

export function useFoodCartQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);
  return useQuery({
    queryKey: foodCartKeys.current(),
    queryFn: getFoodCart,
    enabled: isAuthenticated && !authLoading,
    staleTime: 30_000,
    retry: 1,
    placeholderData: (previous) => previous,
  });
}

export function useFoodCartItemCount(): number {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: cart } = useFoodCartQuery();
  if (!isAuthenticated) return 0;
  return cart?.itemCount ?? 0;
}

export function useAddFoodCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddFoodCartItemPayload) => addFoodCartItem(payload),
    onSuccess: (cart) => {
      qc.setQueryData(foodCartKeys.current(), cart);
    },
  });
}

export function useUpdateFoodCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateFoodCartItem(itemId, { quantity }),
    onSuccess: (cart) => {
      qc.setQueryData(foodCartKeys.current(), cart);
    },
  });
}

export function useRemoveFoodCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeFoodCartItem(itemId),
    onSuccess: (cart) => {
      qc.setQueryData(foodCartKeys.current(), cart);
    },
  });
}

export function useClearFoodCartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearFoodCart,
    onSuccess: () => {
      qc.setQueryData(foodCartKeys.current(), null);
      qc.invalidateQueries({ queryKey: foodKeys.cart() });
    },
  });
}

export function useFoodCartCount(): number {
  const qc = useQueryClient();
  const cart = qc.getQueryData<FoodCart | null>(foodCartKeys.current());
  return cart?.itemCount ?? 0;
}

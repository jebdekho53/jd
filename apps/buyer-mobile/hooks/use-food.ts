import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addFoodCartItem,
  clearFoodCart,
  foodCheckoutCod,
  getFoodCart,
  getRestaurant,
  getRestaurantMenu,
  listCuisines,
  listRestaurants,
  removeFoodCartItem,
  updateFoodCartItem,
} from '@/services/buyer-api';
import type { InitiateFoodCheckoutPayload, ListRestaurantsParams } from '@/types/food';

export const foodKeys = {
  all: ['food'] as const,
  restaurants: (params: ListRestaurantsParams) => ['food', 'restaurants', params] as const,
  restaurant: (slug: string) => ['food', 'restaurant', slug] as const,
  menu: (slug: string) => ['food', 'menu', slug] as const,
  cuisines: ['food', 'cuisines'] as const,
  cart: ['food', 'cart'] as const,
};

export function useCuisinesQuery() {
  return useQuery({ queryKey: foodKeys.cuisines, queryFn: listCuisines, staleTime: 5 * 60_000 });
}

export function useRestaurantsQuery(params: ListRestaurantsParams, enabled = true) {
  return useQuery({
    queryKey: foodKeys.restaurants(params),
    queryFn: () => listRestaurants(params),
    enabled,
    staleTime: 60_000,
  });
}

export function useRestaurantQuery(slug: string) {
  return useQuery({
    queryKey: foodKeys.restaurant(slug),
    queryFn: () => getRestaurant(slug),
    enabled: !!slug,
  });
}

export function useRestaurantMenuQuery(slug: string) {
  return useQuery({
    queryKey: foodKeys.menu(slug),
    queryFn: () => getRestaurantMenu(slug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function useFoodCartQuery() {
  return useQuery({
    queryKey: foodKeys.cart,
    queryFn: getFoodCart,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  });
}

export function useAddFoodCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: addFoodCartItem,
    onSuccess: (cart) => qc.setQueryData(foodKeys.cart, cart),
  });
}

export function useUpdateFoodCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateFoodCartItem(itemId, quantity),
    onSuccess: (cart) => qc.setQueryData(foodKeys.cart, cart),
  });
}

export function useRemoveFoodCartItemMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeFoodCartItem(itemId),
    onSuccess: (cart) => qc.setQueryData(foodKeys.cart, cart),
  });
}

export function useClearFoodCartMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearFoodCart,
    onSuccess: () => qc.setQueryData(foodKeys.cart, null),
  });
}

export function useFoodCheckoutCodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: InitiateFoodCheckoutPayload;
      idempotencyKey?: string;
    }) => foodCheckoutCod(payload, idempotencyKey),
    onSuccess: () => {
      // The food cart is consumed server-side once the order is created.
      qc.setQueryData(foodKeys.cart, null);
    },
  });
}

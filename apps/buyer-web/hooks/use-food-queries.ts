'use client';

import { useQuery } from '@tanstack/react-query';
import {
  foodKeys,
  getRestaurant,
  getRestaurantMenu,
  getVerticals,
  listCuisines,
  listRestaurants,
} from '@/services/food/food-api';
import type { ListRestaurantsParams } from '@/types/food';

export function useVerticalsQuery() {
  return useQuery({
    queryKey: foodKeys.verticals(),
    queryFn: getVerticals,
    staleTime: 300_000,
  });
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
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useRestaurantMenuQuery(slug: string) {
  return useQuery({
    queryKey: foodKeys.menu(slug),
    queryFn: () => getRestaurantMenu(slug),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useCuisinesQuery() {
  return useQuery({
    queryKey: foodKeys.cuisines(),
    queryFn: listCuisines,
    staleTime: 300_000,
  });
}

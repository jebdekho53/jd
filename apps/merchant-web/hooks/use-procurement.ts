'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCartItem,
  createOrder,
  getAnalytics,
  getCart,
  getCreditLines,
  getRecommendations,
  listOrders,
  replaceCart,
  searchProducts,
  searchVendors,
  type CartItemInput,
} from '@/services/procurement/procurement-api';
import type { ProcurementCart } from '@/types/procurement';

export function useRecommendationsQuery(storeId?: string) {
  return useQuery({
    queryKey: ['merchant', 'procurement', 'recommendations', storeId],
    queryFn: () => getRecommendations(storeId!),
    enabled: !!storeId,
  });
}

export function useVendorsQuery(q?: string) {
  return useQuery({
    queryKey: ['merchant', 'procurement', 'vendors', q ?? ''],
    queryFn: () => searchVendors(q),
  });
}

export function useProductsQuery(q?: string) {
  return useQuery({
    queryKey: ['merchant', 'procurement', 'products', q ?? ''],
    queryFn: () => searchProducts(q),
  });
}

export function useCreditLinesQuery() {
  return useQuery({
    queryKey: ['merchant', 'procurement', 'credit'],
    queryFn: () => getCreditLines(),
  });
}

export function useProcurementAnalyticsQuery(storeId?: string) {
  return useQuery({
    queryKey: ['merchant', 'procurement', 'analytics', storeId],
    queryFn: () => getAnalytics(storeId!),
    enabled: !!storeId,
  });
}

export function useProcurementCartQuery(storeId?: string) {
  return useQuery({
    queryKey: ['merchant', 'procurement', 'cart', storeId],
    queryFn: () => getCart(storeId!),
    enabled: !!storeId,
  });
}

function cartKey(storeId?: string) {
  return ['merchant', 'procurement', 'cart', storeId];
}

/**
 * The backend rejects checkout if the cart holds items from more than one
 * vendor (single-vendor-per-order). Rather than let that surface as a 400 at
 * "Place order" time, adding a product from a different vendor than what's
 * already in the cart requires an explicit `replaceExisting` confirmation,
 * which clears the cart down to just the new item first.
 */
export function useAddToCartMutation(storeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      vendorProductId,
      quantity,
      replaceExisting,
    }: {
      vendorProductId: string;
      quantity: number;
      replaceExisting?: boolean;
    }) => {
      if (replaceExisting) {
        return replaceCart(storeId!, [{ vendorProductId, quantity }]);
      }
      return addCartItem(storeId!, vendorProductId, quantity);
    },
    onSuccess: (cart) => qc.setQueryData(cartKey(storeId), cart),
  });
}

export function useUpdateCartItemMutation(storeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cart, vendorProductId, quantity }: { cart: ProcurementCart; vendorProductId: string; quantity: number }) => {
      const items: CartItemInput[] = cart.items.map((i) => ({
        vendorProductId: i.vendorProductId,
        quantity: i.vendorProductId === vendorProductId ? quantity : i.quantity,
      }));
      return replaceCart(storeId!, items, cart.vendorId ?? undefined);
    },
    onSuccess: (cart) => qc.setQueryData(cartKey(storeId), cart),
  });
}

export function useRemoveCartItemMutation(storeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cart, vendorProductId }: { cart: ProcurementCart; vendorProductId: string }) => {
      const items: CartItemInput[] = cart.items
        .filter((i) => i.vendorProductId !== vendorProductId)
        .map((i) => ({ vendorProductId: i.vendorProductId, quantity: i.quantity }));
      return replaceCart(storeId!, items);
    },
    onSuccess: (cart) => qc.setQueryData(cartKey(storeId), cart),
  });
}

export function useCreateOrderMutation(storeId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts?: { notes?: string; useCredit?: boolean }) => createOrder(storeId!, opts),
    onSuccess: () => {
      qc.setQueryData(cartKey(storeId), (cart: ProcurementCart | undefined) =>
        cart ? { ...cart, items: [] } : cart,
      );
      qc.invalidateQueries({ queryKey: ['merchant', 'procurement', 'orders', storeId] });
    },
  });
}

export function useProcurementOrdersQuery(storeId?: string) {
  return useQuery({
    queryKey: ['merchant', 'procurement', 'orders', storeId],
    queryFn: () => listOrders(storeId!),
    enabled: !!storeId,
  });
}

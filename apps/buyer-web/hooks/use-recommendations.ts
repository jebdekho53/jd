'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchRecommendations } from '@/services/crm/crm-api';
import { searchProducts } from '@/services/buyer/buyer-api';
import { useAuthStore } from '@/store/auth-store';
import type { BuyerProductWithStore } from '@/types/buyer';

/**
 * Personalized product picks, backed by CustomerAffinity/RecommendationScore
 * (built from real VIEW_PRODUCT/ADD_CART/ORDER_PLACED events). Falls back to
 * globally popular products server-side when a buyer has no affinity history
 * yet — see RecommendationService.getRecommendations.
 */
export function useRecommendedProducts(lat: number, lng: number, pincode?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.loading);

  return useQuery({
    queryKey: ['recommendations', 'product', lat, lng, pincode],
    queryFn: async (): Promise<BuyerProductWithStore[]> => {
      const entries = await fetchRecommendations('product');
      const ids = entries.map((e) => e.entityId);
      if (ids.length === 0) return [];

      const { data } = await searchProducts({ productIds: ids, lat, lng, pincode, limit: ids.length });
      const order = new Map(ids.map((id, i) => [id, i]));
      return [...data].sort((a, b) => (order.get(a.id) ?? ids.length) - (order.get(b.id) ?? ids.length));
    },
    enabled: isAuthenticated && !authLoading && Boolean(lat && lng),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

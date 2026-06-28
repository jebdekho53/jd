'use client';

import { useQuery } from '@tanstack/react-query';
import { compareProduct, buyerKeys } from '@/services/buyer/buyer-api';
import type { CompareProductResult } from '@/services/buyer/buyer-api';
import { useEffectiveLocation } from '@/store/location-store';

export type CompareProductData = CompareProductResult;

export function useCompareProduct(productId: string, enabled = true) {
  const { lat, lng, pincode } = useEffectiveLocation();
  return useQuery({
    queryKey: buyerKeys.compare(productId, lat, lng, pincode),
    queryFn: () => compareProduct(productId, { lat, lng, pincode }),
    enabled: enabled && Boolean(productId),
    staleTime: 60_000,
  });
}

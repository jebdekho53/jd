'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrderDetail } from '@/services/admin-api';
import type { OrderDetail } from '@/types/order-detail';

export const adminOrderDetailKeys = {
  detail: (id: string) => ['admin', 'orders', 'detail', id] as const,
};

export function useAdminOrderDetailQuery(orderId: string) {
  return useQuery({
    queryKey: adminOrderDetailKeys.detail(orderId),
    queryFn: () => getOrderDetail(orderId),
    enabled: Boolean(orderId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15_000,
  });
}

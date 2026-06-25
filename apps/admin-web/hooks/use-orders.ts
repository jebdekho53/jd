'use client';

import { useQuery } from '@tanstack/react-query';
import { listOrders } from '@/services/admin-api';
import type { ListOrdersParams } from '@/types/order';

export const adminOrderKeys = {
  all: ['admin', 'orders'] as const,
  list: (params: ListOrdersParams) => [...adminOrderKeys.all, 'list', params] as const,
};

export function useAdminOrdersQuery(params: ListOrdersParams = {}) {
  return useQuery({
    queryKey: adminOrderKeys.list(params),
    queryFn: () => listOrders(params),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 15_000,
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelOrder, getOrderDetail, listOrders } from '@/services/orders/orders-api';
import type { ListOrdersParams, OrderStatus } from '@/types/orders';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params: ListOrdersParams) => [...orderKeys.all, 'list', params] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
};

export function useOrdersQuery(params: ListOrdersParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => listOrders(params),
    staleTime: 30_000,
  });
}

export function useOrderDetailQuery(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderDetail(orderId),
    staleTime: 30_000,
    enabled: Boolean(orderId),
  });
}

export function useCancelOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      cancelOrder(orderId, reason),
    onSuccess: (updated) => {
      qc.setQueryData(orderKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listOrders,
  getOrderDetail,
  confirmOrder,
  markPreparing,
  markReady,
  cancelOrder,
} from '@/services/orders/orders-api';
import type { ListOrdersParams } from '@/types/order';

export function useOrdersQuery(params: ListOrdersParams = {}) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => listOrders(params),
    refetchInterval: 30_000,
  });
}

export function useOrderDetailQuery(orderId: string) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => getOrderDetail(orderId),
    enabled: Boolean(orderId),
  });
}

function useOrderActionMutation(actionFn: (id: string) => Promise<unknown>, orderId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => actionFn(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      if (orderId) qc.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}

export const useConfirmOrderMutation = (orderId?: string) => useOrderActionMutation(confirmOrder, orderId);
export const useMarkPreparingMutation = (orderId?: string) => useOrderActionMutation(markPreparing, orderId);
export const useMarkReadyMutation = (orderId?: string) => useOrderActionMutation(markReady, orderId);

export function useCancelOrderMutation(orderId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelOrder(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      if (orderId) qc.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}

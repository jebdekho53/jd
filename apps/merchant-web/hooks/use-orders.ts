'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listOrders,
  getOrderDetail,
  confirmOrder,
  markPreparing,
  markPacking,
  markReady,
  markIssue,
  cancelOrder,
} from '@/services/orders/orders-api';
import type { ListOrdersParams } from '@/types/order';

export function useOrdersQuery(params: ListOrdersParams = {}, options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => listOrders(params),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: options?.refetchInterval ?? 15_000,
  });
}

export function useOrderDetailQuery(orderId: string) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => getOrderDetail(orderId),
    enabled: Boolean(orderId),
    refetchInterval: 15_000,
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
export const useMarkPackingMutation = (orderId?: string) => useOrderActionMutation(markPacking, orderId);
export const useMarkReadyMutation = (orderId?: string) => useOrderActionMutation(markReady, orderId);

export function useMarkIssueMutation(orderId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => markIssue(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      if (orderId) qc.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}

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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelOrder, getOrder, listOrders } from '@/services/buyer-api';

const NON_TERMINAL_ORDER_STATUSES = new Set([
  'MERCHANT_ACCEPTED',
  'PREPARING',
  'PACKING',
  'READY_FOR_PICKUP',
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
]);

export const orderKeys = {
  list: (params?: object) => ['orders', 'list', params] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
};

export function useOrdersListQuery(params?: {
  statusGroup?: 'active' | 'cancelled' | 'completed';
  page?: number;
}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => listOrders(params),
    placeholderData: (previous) => previous,
  });
}

export function useOrderDetailQuery(orderId: string) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
    refetchInterval: (query) => (NON_TERMINAL_ORDER_STATUSES.has(query.state.data?.status ?? '') ? 15_000 : false),
  });
}

export function useCancelOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => cancelOrder(orderId, reason),
    onSuccess: (order) => {
      qc.setQueryData(orderKeys.detail(order.id), order);
      qc.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
  });
}

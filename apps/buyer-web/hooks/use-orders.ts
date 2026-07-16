'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelOrder, getDeliveryOtp, getOrderDetail, listOrders } from '@/services/orders/orders-api';
import type { ListOrdersParams, OrderStatus } from '@/types/orders';

export const orderKeys = {
  all: ['orders'] as const,
  list: (params: ListOrdersParams) => [...orderKeys.all, 'list', params] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  deliveryOtp: (id: string) => [...orderKeys.all, 'delivery-otp', id] as const,
};

// Statuses during which a buyer may need to read out the delivery OTP.
const OTP_VISIBLE_STATUSES = new Set<OrderStatus>([
  'RIDER_ASSIGNED',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
]);

/** Whether the delivery OTP card should even attempt to fetch, given order status. */
export function isDeliveryOtpVisible(status: OrderStatus | undefined): boolean {
  return status ? OTP_VISIBLE_STATUSES.has(status) : false;
}

/**
 * Fetches the delivery OTP only while the order is in an active hand-over stage.
 * The server returns null once verified/terminal, so the card self-hides.
 */
export function useDeliveryOtpQuery(orderId: string, orderStatus: OrderStatus | undefined) {
  const active = isDeliveryOtpVisible(orderStatus);
  return useQuery({
    queryKey: orderKeys.deliveryOtp(orderId),
    queryFn: () => getDeliveryOtp(orderId),
    enabled: Boolean(orderId) && active,
    staleTime: 15_000,
    refetchInterval: active ? 30_000 : false,
  });
}

export function useOrdersQuery(params: ListOrdersParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => listOrders(params),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useOrderDetailQuery(orderId: string) {
  const ACTIVE = new Set([
    'PAID', 'MERCHANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP',
    'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED',
  ]);

  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrderDetail(orderId),
    staleTime: 10_000,
    enabled: Boolean(orderId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ACTIVE.has(status) ? 15_000 : false;
    },
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

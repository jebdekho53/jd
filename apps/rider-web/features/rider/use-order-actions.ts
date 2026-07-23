'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  acceptOrder,
  arrivedCustomer,
  arrivedStore,
  markDelivered,
  markFailed,
  pickedUp,
  rejectOrder,
} from '@/lib/api';

const VERBS: Record<string, (id: string) => Promise<unknown>> = {
  accept: acceptOrder,
  'arrived-store': arrivedStore,
  'picked-up': pickedUp,
  'arrived-customer': arrivedCustomer,
  delivered: markDelivered,
};

/**
 * The delivery-state mutations, shared by the orders list, the order detail
 * screen, and the home screen's offer card. Every one of them invalidates the
 * same four keys — a handover changes the order, the list, the profile
 * (delivery count, status) and the COD balance at once.
 */
export function useOrderActions() {
  const qc = useQueryClient();

  const invalidate = async (orderId?: string) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['rider', 'orders'] }),
      qc.invalidateQueries({ queryKey: orderId ? ['rider', 'order', orderId] : ['rider', 'order'] }),
      qc.invalidateQueries({ queryKey: ['rider', 'me'] }),
      qc.invalidateQueries({ queryKey: ['rider', 'finance'] }),
    ]);
  };

  const action = useMutation({
    mutationFn: ({ orderId, verb }: { orderId: string; verb: string }) => VERBS[verb](orderId),
    onSuccess: (_data, { orderId }) => invalidate(orderId),
  });

  const reject = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => rejectOrder(orderId, reason),
    onSuccess: (_data, { orderId }) => invalidate(orderId),
  });

  const fail = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => markFailed(orderId, reason),
    onSuccess: (_data, { orderId }) => invalidate(orderId),
  });

  return {
    action,
    reject,
    fail,
    busy: action.isPending || reject.isPending || fail.isPending,
  };
}

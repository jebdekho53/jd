import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptOrder,
  arrivedAtCustomer,
  arrivedAtStore,
  deliveredOrder,
  getRiderOrder,
  pickedUpOrder,
  rejectOrder,
  RiderApiError,
  RequestLockError,
} from '@/services/rider-api';
import { useDeliveryStore } from '@/store/delivery-store';
import { useRiderStore } from '@/store/rider-store';
import {
  canAdvance,
  getNextStatus,
  isActiveDelivery,
  statusToAction,
} from '@/lib/delivery-state-machine';
import { isStaleTransition } from '@/services/anti-fraud';
import { enqueueOffline } from '@/services/offline-queue';
import { log } from '@/services/logger';
import type { DeliveryStatus, RiderOrderDetail } from '@/types/order';
import { orderDetailKey, ORDERS_KEY } from '@/hooks/use-orders';

const optimisticTimestamps = new Map<string, number>();

export function useOrderDetailQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: orderDetailKey(orderId ?? ''),
    queryFn: () => getRiderOrder(orderId!),
    enabled: Boolean(orderId),
  });
}

export function useDeliveryMutations(orderId: string) {
  const qc = useQueryClient();
  const setActiveOrder = useDeliveryStore((s) => s.setActiveOrder);
  const setStatus = useDeliveryStore((s) => s.setStatus);
  const setLocked = useDeliveryStore((s) => s.setLocked);
  const setActiveDelivery = useRiderStore((s) => s.setActiveDelivery);
  const setAvailability = useRiderStore((s) => s.setAvailability);

  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: ORDERS_KEY });
    await qc.invalidateQueries({ queryKey: orderDetailKey(orderId) });
  };

  const advance = useMutation({
    mutationFn: async ({
      current,
      target,
    }: {
      current: DeliveryStatus;
      target: DeliveryStatus;
    }) => {
      const ts = optimisticTimestamps.get(orderId);
      if (ts && isStaleTransition(ts)) {
        throw new RiderApiError('Stale transition blocked — refresh and retry', 409);
      }

      if (!canAdvance(current, target)) {
        throw new Error(`Cannot move from ${current} to ${target}`);
      }
      const action = statusToAction(target);
      if (!action || action === 'reject' || action === 'failed') {
        throw new Error('Invalid transition');
      }
      switch (action) {
        case 'accept':
          return acceptOrder(orderId);
        case 'arrived-store':
          return arrivedAtStore(orderId);
        case 'picked-up':
          return pickedUpOrder(orderId);
        case 'arrived-customer':
          return arrivedAtCustomer(orderId);
        case 'delivered':
          return deliveredOrder(orderId);
      }
    },
    onMutate: async ({ target }) => {
      optimisticTimestamps.set(orderId, Date.now());
      await qc.cancelQueries({ queryKey: orderDetailKey(orderId) });
      const prev = qc.getQueryData<RiderOrderDetail>(orderDetailKey(orderId));
      if (prev) {
        const optimistic = { ...prev, deliveryStatus: target };
        qc.setQueryData(orderDetailKey(orderId), optimistic);
        setActiveOrder(optimistic);
        setStatus(target);
        setLocked(isActiveDelivery(target));
      }
      return { prev };
    },
    onError: async (err, vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(orderDetailKey(orderId), ctx.prev);
        setActiveOrder(ctx.prev);
        setStatus(ctx.prev.deliveryStatus);
      }

      if (err instanceof RiderApiError && err.status === 0) {
        const action = statusToAction(vars.target);
        if (action && action !== 'reject' && action !== 'failed') {
          await enqueueOffline({ type: 'status', orderId, action });
          log('OFFLINE_SYNC', 'Queued status offline', { orderId, action });
        }
      }

      if (err instanceof RequestLockError) {
        log('ORDER_STATE_CHANGE', 'Duplicate action blocked', { orderId });
      }
    },
    onSuccess: (data) => {
      optimisticTimestamps.delete(orderId);
      setActiveOrder(data);
      setStatus(data.deliveryStatus);
      setLocked(isActiveDelivery(data.deliveryStatus));
      if (data.deliveryStatus === 'ACCEPTED') {
        setActiveDelivery(orderId);
        setAvailability('ON_DELIVERY');
      }
      if (data.deliveryStatus === 'DELIVERED') {
        setActiveDelivery(null);
        setAvailability('ONLINE');
        setLocked(false);
      }
      qc.setQueryData(orderDetailKey(orderId), data);
    },
    onSettled: invalidate,
  });

  const accept = useMutation({
    mutationFn: () => acceptOrder(orderId),
    onSuccess: (data) => {
      setActiveOrder(data);
      setLocked(true);
      setActiveDelivery(orderId);
      setAvailability('ON_DELIVERY');
      qc.setQueryData(orderDetailKey(orderId), data);
    },
    onError: async (err) => {
      if (err instanceof RiderApiError && err.status === 0) {
        await enqueueOffline({ type: 'status', orderId, action: 'accept' });
      }
    },
    onSettled: invalidate,
  });

  const reject = useMutation({
    mutationFn: (reason?: string) => rejectOrder(orderId, reason),
    onSettled: invalidate,
  });

  return { advance, accept, reject };
}

export function useAdvanceDelivery(order: RiderOrderDetail | undefined) {
  const { advance } = useDeliveryMutations(order?.deliveryId ?? '');

  const next = order ? getNextStatus(order.deliveryStatus) : null;

  const advanceToNext = () => {
    if (!order || !next) return;
    advance.mutate({ current: order.deliveryStatus, target: next });
  };

  return { next, advanceToNext, isPending: advance.isPending, error: advance.error };
}

export function isNetworkError(err: unknown): boolean {
  return err instanceof RiderApiError && err.status === 0;
}

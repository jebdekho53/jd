import { useEffect, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { connectSocket, disconnectSocket, subscribeSocket } from '@/services/socket';
import { ORDERS_KEY, orderDetailKey } from '@/hooks/use-orders';
import { EARNINGS_KEY, EARNINGS_HISTORY_KEY, EARNINGS_TODAY_KEY } from '@/hooks/use-earnings';
import {
  notifyOrderAssigned,
  notifyOrderCancelled,
  registerForPushNotifications,
  subscribeNotificationResponses,
} from '@/services/notifications';
import {
  flushOfflineQueue,
  startOfflineRetryLoop,
  stopOfflineRetryLoop,
  getQueueStats,
} from '@/services/offline-queue';
import {
  pushLocation,
  arrivedAtStore,
  pickedUpOrder,
  arrivedAtCustomer,
  deliveredOrder,
  acceptOrder,
  listRiderOrders,
  getRiderOrder,
} from '@/services/rider-api';
import { syncOfflineLocations } from '@/services/gps-service';
import { useGpsLifecycle } from '@/hooks/use-location';
import {
  reconcileDeliveryState,
  startConsistencyLoop,
  stopConsistencyLoop,
} from '@/services/sync-consistency.service';
import { startLogFlusher, stopLogFlusher } from '@/services/logger';
import { useSyncStore } from '@/store/sync-store';
import type { OfflineQueueItem } from '@/services/offline-queue';

const statusActions: Record<string, (id: string) => Promise<unknown>> = {
  accept: acceptOrder,
  'arrived-store': arrivedAtStore,
  'picked-up': pickedUpOrder,
  'arrived-customer': arrivedAtCustomer,
  delivered: deliveredOrder,
};

async function processOfflineItem(item: OfflineQueueItem) {
  if (item.type === 'location') {
    await pushLocation(item.payload as unknown as Parameters<typeof pushLocation>[0]);
  } else if (item.type === 'status') {
    const fn = statusActions[item.action];
    if (fn) await fn(item.orderId);
  }
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const router = useRouter();
  const knownAssigned = useRef(new Set<string>());

  useGpsLifecycle();

  const refreshOrders = () => {
    void qc.invalidateQueries({ queryKey: ORDERS_KEY });
    void qc.invalidateQueries({ queryKey: EARNINGS_KEY });
    void qc.invalidateQueries({ queryKey: EARNINGS_TODAY_KEY });
    void qc.invalidateQueries({ queryKey: EARNINGS_HISTORY_KEY });
  };

  useEffect(() => {
    void registerForPushNotifications();
    void getQueueStats().then(({ pending, deadLetter }) => {
      useSyncStore.getState().setStats(pending, deadLetter);
    });

    startLogFlusher();
    startOfflineRetryLoop(processOfflineItem);
    startConsistencyLoop();

    const unsubNotif = subscribeNotificationResponses((path) => router.push(path as never));

    const pollOrders = async () => {
      try {
        const orders = await listRiderOrders();
        for (const o of orders) {
          if (o.deliveryStatus === 'ASSIGNED' && !knownAssigned.current.has(o.deliveryId)) {
            knownAssigned.current.add(o.deliveryId);
            void notifyOrderAssigned(o.deliveryId, o.orderNumber);
          }
        }
        refreshOrders();
      } catch {
        /* offline */
      }
    };

    const pollActiveOrder = async (orderId: string) => {
      try {
        const detail = await getRiderOrder(orderId);
        qc.setQueryData(orderDetailKey(orderId), detail);
      } catch {
        /* offline */
      }
    };

    void connectSocket({ pollOrders, pollActiveOrder });

    const unsubSocket = subscribeSocket((event) => {
      if (event.type === 'order.assigned' && 'orderId' in event) {
        void notifyOrderAssigned(event.orderId, event.orderId);
        refreshOrders();
      }
      if (event.type === 'order.cancelled') {
        void notifyOrderCancelled(event.orderId);
        refreshOrders();
      }
      if (event.type === 'order.updated' || event.type === 'rider.location.request') {
        refreshOrders();
      }
    });

    const netSub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        void flushOfflineQueue(processOfflineItem);
        void syncOfflineLocations();
        void reconcileDeliveryState();
        refreshOrders();
      }
    });

    const cachePurge = setInterval(() => {
      qc.removeQueries({
        predicate: (q) => {
          const updated = q.state.dataUpdatedAt;
          return updated > 0 && Date.now() - updated > 10 * 60 * 1000;
        },
      });
    }, 5 * 60 * 1000);

    return () => {
      disconnectSocket();
      unsubSocket();
      unsubNotif();
      netSub();
      stopOfflineRetryLoop();
      stopConsistencyLoop();
      stopLogFlusher();
      clearInterval(cachePurge);
    };
  }, [qc, router]);

  return children;
}

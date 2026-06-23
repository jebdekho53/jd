import { listRiderOrders, getRiderOrder } from '@/services/rider-api';
import { useDeliveryStore } from '@/store/delivery-store';
import { useRiderStore } from '@/store/rider-store';
import { isActiveDelivery, isTerminal } from '@/lib/delivery-state-machine';
import { log } from '@/services/logger';
import type { DeliveryStatus } from '@/types/order';

const STATUS_RANK: Record<DeliveryStatus, number> = {
  ASSIGNED: 0,
  ACCEPTED: 1,
  ARRIVED_AT_STORE: 2,
  PICKED_UP: 3,
  ARRIVED_AT_CUSTOMER: 4,
  DELIVERED: 5,
  FAILED: 6,
  CANCELLED: 6,
  REJECTED: 6,
};

function rank(status: DeliveryStatus): number {
  return STATUS_RANK[status] ?? 0;
}

let reconcileTimer: ReturnType<typeof setInterval> | null = null;

export async function reconcileDeliveryState(): Promise<void> {
  const delivery = useDeliveryStore.getState();
  const rider = useRiderStore.getState();
  const local = delivery.activeOrder;

  try {
    const serverList = await listRiderOrders();
    delivery.syncFromList(serverList);

    const serverActive = serverList.find((o) => isActiveDelivery(o.deliveryStatus));

    if (!local && serverActive) {
      const detail = await getRiderOrder(serverActive.deliveryId);
      delivery.setActiveOrder(detail);
      rider.setActiveDelivery(serverActive.deliveryId);
      log('ORDER_STATE_CHANGE', 'Reconciled missing local active order', {
        orderId: serverActive.deliveryId,
      });
      return;
    }

    if (local && !serverActive) {
      const serverRow = serverList.find((o) => o.deliveryId === local.deliveryId);
      if (!serverRow || isTerminal(serverRow.deliveryStatus)) {
        delivery.setActiveOrder(null);
        rider.setActiveDelivery(null);
        delivery.setLocked(false);
        log('ORDER_STATE_CHANGE', 'Cleared stale local active order');
      }
      return;
    }

    if (local && serverActive && local.deliveryId === serverActive.deliveryId) {
      const localR = rank(local.deliveryStatus);
      const serverR = rank(serverActive.deliveryStatus);

      if (localR > serverR) {
        const detail = await getRiderOrder(local.deliveryId);
        delivery.setActiveOrder(detail);
        log('ORDER_STATE_CHANGE', 'Reverted ahead-of-server UI state', {
          local: local.deliveryStatus,
          server: serverActive.deliveryStatus,
        });
      } else if (serverR > localR || local.deliveryStatus !== serverActive.deliveryStatus) {
        const detail = await getRiderOrder(serverActive.deliveryId);
        delivery.setActiveOrder(detail);
        log('ORDER_STATE_CHANGE', 'Synced server-ahead state', {
          local: local.deliveryStatus,
          server: serverActive.deliveryStatus,
        });
      }
    }

    if (local && serverActive && local.deliveryId !== serverActive.deliveryId) {
      const detail = await getRiderOrder(serverActive.deliveryId);
      delivery.setActiveOrder(detail);
      rider.setActiveDelivery(serverActive.deliveryId);
      log('ORDER_STATE_CHANGE', 'Resolved conflicting active orders — server wins');
    }
  } catch (err) {
    log('ERROR', 'Reconciliation failed', { err: String(err) });
  }
}

export function startConsistencyLoop() {
  if (reconcileTimer) return;
  reconcileTimer = setInterval(() => {
    void reconcileDeliveryState();
  }, 60_000);
}

export function stopConsistencyLoop() {
  if (reconcileTimer) clearInterval(reconcileTimer);
  reconcileTimer = null;
}

import { create } from 'zustand';
import type { RiderOrderDetail, RiderOrderListItem, DeliveryStatus } from '@/types/order';
import { isActiveDelivery } from '@/lib/delivery-state-machine';

interface DeliveryState {
  activeOrder: RiderOrderDetail | null;
  orderQueue: RiderOrderListItem[];
  currentStatus: DeliveryStatus | null;
  isLocked: boolean;
  setQueue: (orders: RiderOrderListItem[]) => void;
  setActiveOrder: (order: RiderOrderDetail | null) => void;
  syncFromList: (orders: RiderOrderListItem[]) => void;
  setStatus: (status: DeliveryStatus) => void;
  setLocked: (v: boolean) => void;
  clear: () => void;
}

export const useDeliveryStore = create<DeliveryState>()((set, get) => ({
  activeOrder: null,
  orderQueue: [],
  currentStatus: null,
  isLocked: false,

  setQueue: (orderQueue) => set({ orderQueue }),

  setActiveOrder: (activeOrder) => {
    if (activeOrder?.deliveryStatus === 'DELIVERED') {
      set({
        activeOrder: null,
        currentStatus: 'DELIVERED',
        isLocked: false,
      });
      return;
    }
    set({
      activeOrder,
      currentStatus: activeOrder?.deliveryStatus ?? null,
      isLocked: activeOrder ? isActiveDelivery(activeOrder.deliveryStatus) : false,
    });
  },

  syncFromList: (orders) => {
    const active = orders.find((o) => isActiveDelivery(o.deliveryStatus));
    const assigned = orders.filter((o) => o.deliveryStatus === 'ASSIGNED');
    const { activeOrder } = get();

    set({
      orderQueue: assigned,
      currentStatus: active?.deliveryStatus ?? activeOrder?.deliveryStatus ?? null,
      isLocked: Boolean(active),
    });
  },

  setStatus: (currentStatus) => set({ currentStatus }),

  setLocked: (isLocked) => set({ isLocked }),

  clear: () =>
    set({
      activeOrder: null,
      orderQueue: [],
      currentStatus: null,
      isLocked: false,
    }),
}));

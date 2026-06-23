import { create } from 'zustand';
import type { RiderAvailability } from '@/types/rider';

interface RiderState {
  /** Server-synced availability — ONLINE / OFFLINE / ON_DELIVERY / BUSY */
  availability: RiderAvailability;
  /** Local intent while toggling — prevents double-tap */
  isToggling: boolean;
  activeDeliveryId: string | null;
  setAvailability: (status: RiderAvailability) => void;
  setToggling: (v: boolean) => void;
  setActiveDelivery: (orderId: string | null) => void;
  reset: () => void;
}

export const useRiderStore = create<RiderState>()((set) => ({
  availability: 'OFFLINE',
  isToggling: false,
  activeDeliveryId: null,
  setAvailability: (availability) => set({ availability }),
  setToggling: (isToggling) => set({ isToggling }),
  setActiveDelivery: (activeDeliveryId) => set({ activeDeliveryId }),
  reset: () =>
    set({
      availability: 'OFFLINE',
      isToggling: false,
      activeDeliveryId: null,
    }),
}));

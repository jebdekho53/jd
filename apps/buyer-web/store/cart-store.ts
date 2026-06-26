/**
 * Cart UI store — holds the single-store conflict state and drawer open state.
 * Actual cart data lives in TanStack Query cache (use-cart.ts).
 */
import { create } from 'zustand';

interface CartUiState {
  drawerOpen: boolean;
  /** Details of existing store when a cross-store conflict is detected */
  conflictStore: { name: string; storeId: string } | null;
  /** Payload that caused the conflict — pending user decision */
  pendingAddPayload: {
    productId: string;
    variantId: string;
    quantity: number;
    newStoreName: string;
    newStoreId: string;
  } | null;

  openDrawer: () => void;
  closeDrawer: () => void;
  setConflict: (
    existingStore: { name: string; storeId: string },
    pending: CartUiState['pendingAddPayload'],
  ) => void;
  clearConflict: () => void;
}

export const useCartStore = create<CartUiState>((set) => ({
  drawerOpen: false,
  conflictStore: null,
  pendingAddPayload: null,

  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  setConflict: (existingStore, pending) =>
    set({ conflictStore: existingStore, pendingAddPayload: pending }),
  clearConflict: () => set({ conflictStore: null, pendingAddPayload: null }),
}));

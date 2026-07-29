import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface GuestCartLine {
  productId: string;
  variantId: string;
  quantity: number;
  storeId: string;
  storeName: string;
  productName: string;
  variantName: string | null;
  unitPrice: number;
  imageUrl: string | null;
  availableQty: number;
}

export class StoreConflictError extends Error {
  constructor(public currentStoreName: string) {
    super('STORE_CONFLICT');
    this.name = 'StoreConflictError';
  }
}

interface GuestCartState {
  storeId: string | null;
  storeName: string | null;
  items: GuestCartLine[];
  hydrated: boolean;
  addItem: (line: Omit<GuestCartLine, 'quantity'> & { quantity?: number }) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
}

/**
 * Guests get a local cart so they can browse and add items before signing
 * in; it is merged into the server cart on login (see useMergeGuestCart in
 * hooks/use-auth.ts). One store at a time, same rule the server cart
 * enforces, so the merge never has to reconcile two different stores.
 * Unlike the server cart, this has no delivery-fee/tax/promo computation —
 * cart-screen.tsx shows only a subtotal for guests and prompts sign-in
 * before checkout, where the real total is computed server-side.
 */
export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      storeId: null,
      storeName: null,
      items: [],
      hydrated: false,

      addItem: (line) => {
        const qty = line.quantity ?? 1;
        const state = get();

        if (state.storeId && state.storeId !== line.storeId) {
          throw new StoreConflictError(state.storeName ?? 'another store');
        }

        const existing = state.items.find((i) => i.variantId === line.variantId);
        const nextItems = existing
          ? state.items.map((i) =>
              i.variantId === line.variantId ? { ...i, quantity: i.quantity + qty } : i,
            )
          : [...state.items, { ...line, quantity: qty }];

        set({ storeId: line.storeId, storeName: line.storeName, items: nextItems });
      },

      setQuantity: (variantId, quantity) => {
        const state = get();
        if (quantity <= 0) {
          const items = state.items.filter((i) => i.variantId !== variantId);
          set({ items, ...(items.length === 0 ? { storeId: null, storeName: null } : {}) });
          return;
        }
        set({ items: state.items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)) });
      },

      removeItem: (variantId) => {
        const items = get().items.filter((i) => i.variantId !== variantId);
        set({ items, ...(items.length === 0 ? { storeId: null, storeName: null } : {}) });
      },

      clear: () => set({ storeId: null, storeName: null, items: [] }),
    }),
    {
      name: 'buyer-guest-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ storeId: state.storeId, storeName: state.storeName, items: state.items }),
      onRehydrateStorage: () => () => {
        useGuestCartStore.setState({ hydrated: true });
      },
    },
  ),
);

export function guestCartItemCount(): number {
  return useGuestCartStore.getState().items.reduce((sum, i) => sum + i.quantity, 0);
}

export function guestCartSubtotal(): number {
  return useGuestCartStore
    .getState()
    .items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

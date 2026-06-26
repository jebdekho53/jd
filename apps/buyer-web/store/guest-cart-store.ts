import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestCartLine {
  productId: string;
  variantId: string;
  quantity: number;
  storeId: string;
  storeName: string;
  productName?: string;
  unitPrice?: number;
  imageUrl?: string;
  availableQty?: number;
}

interface GuestCartState {
  storeId: string | null;
  storeName: string | null;
  items: GuestCartLine[];
  addItem: (line: Omit<GuestCartLine, 'quantity'> & { quantity?: number }) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  itemCount: () => number;
}

export const useGuestCartStore = create<GuestCartState>()(
  persist(
    (set, get) => ({
      storeId: null,
      storeName: null,
      items: [],

      addItem: (line) => {
        const qty = line.quantity ?? 1;
        const state = get();

        if (state.storeId && state.storeId !== line.storeId) {
          throw new Error('STORE_CONFLICT');
        }

        const existing = state.items.find((i) => i.variantId === line.variantId);
        const nextItems = existing
          ? state.items.map((i) =>
              i.variantId === line.variantId
                ? { ...i, quantity: i.quantity + qty, ...line }
                : i,
            )
          : [...state.items, { ...line, quantity: qty }];

        set({
          storeId: line.storeId,
          storeName: line.storeName,
          items: nextItems,
        });
      },

      setQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
        });
      },

      removeItem: (variantId) => {
        const next = get().items.filter((i) => i.variantId !== variantId);
        set({
          items: next,
          storeId: next.length ? get().storeId : null,
          storeName: next.length ? get().storeName : null,
        });
      },

      clear: () => set({ storeId: null, storeName: null, items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'jebdekho-guest-cart' },
  ),
);

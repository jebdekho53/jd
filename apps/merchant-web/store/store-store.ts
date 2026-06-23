import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Store } from '@/types/store';

interface StoreState {
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
}

export const useStoreStore = create<StoreState>()(
  persist(
    (set) => ({
      currentStore: null,
      setCurrentStore: (store) => set({ currentStore: store }),
    }),
    {
      name: 'jd-merchant-store-ctx',
      partialize: (s) => ({
        currentStore: s.currentStore ? { id: s.currentStore.id, name: s.currentStore.name } : null,
      }),
    },
  ),
);

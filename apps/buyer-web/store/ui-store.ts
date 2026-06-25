import { create } from 'zustand';

interface UiState {
  storeSearchQuery: string;
  selectedCategoryId: string | null;
  setStoreSearchQuery: (query: string) => void;
  setSelectedCategoryId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  storeSearchQuery: '',
  selectedCategoryId: null,
  setStoreSearchQuery: (storeSearchQuery) => set({ storeSearchQuery }),
  setSelectedCategoryId: (selectedCategoryId) => set({ selectedCategoryId }),
}));

/** @deprecated Import from @/store/location-store */
export {
  useLocationStore,
  useEffectiveLocation,
  FALLBACK_LOCATIONS,
  DEFAULT_LOCATION,
} from '@/store/location-store';

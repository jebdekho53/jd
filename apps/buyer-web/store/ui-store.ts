import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Default: Connaught Place, New Delhi */
export const DEFAULT_LOCATION = {
  lat: 28.6139,
  lng: 77.209,
  label: 'Connaught Place, Delhi',
};

interface LocationState {
  lat: number;
  lng: number;
  label: string;
  setLocation: (lat: number, lng: number, label: string) => void;
  resetLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      ...DEFAULT_LOCATION,
      setLocation: (lat, lng, label) => set({ lat, lng, label }),
      resetLocation: () => set(DEFAULT_LOCATION),
    }),
    { name: 'jebdekho-location' },
  ),
);

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

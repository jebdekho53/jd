import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LocationSource = 'gps' | 'manual' | 'default';

export interface LocationCoords {
  lat: number;
  lng: number;
  label: string;
  source: LocationSource;
}

interface LocationState extends LocationCoords {
  isReady: boolean;
  setFromGps: (lat: number, lng: number, label?: string) => void;
  setManual: (lat: number, lng: number, label: string) => void;
  setDefault: (lat: number, lng: number, label: string) => void;
  clear: () => void;
}

const EMPTY: LocationCoords & { isReady: boolean } = {
  lat: 0,
  lng: 0,
  label: '',
  source: 'default',
  isReady: false,
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      ...EMPTY,
      setFromGps: (lat, lng, label = 'Current location') =>
        set({ lat, lng, label, source: 'gps', isReady: true }),
      setManual: (lat, lng, label) =>
        set({ lat, lng, label, source: 'manual', isReady: true }),
      setDefault: (lat, lng, label) =>
        set({ lat, lng, label, source: 'default', isReady: true }),
      clear: () => set(EMPTY),
    }),
    { name: 'jebdekho-location-v2' },
  ),
);

/** Delhi default for manual fallback preset */
export const FALLBACK_LOCATIONS = [
  { label: 'Connaught Place, Delhi', lat: 28.6139, lng: 77.209 },
  { label: 'Cyber City, Gurgaon', lat: 28.4941, lng: 77.0886 },
  { label: 'Sector 18, Noida', lat: 28.5706, lng: 77.3219 },
] as const;

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LocationSource = 'gps' | 'manual' | 'default' | 'master';

export interface LocationCoords {
  lat: number;
  lng: number;
  label: string;
  source: LocationSource;
  pincode?: string;
  city?: string;
  area?: string;
  locationPincodeId?: string;
  locationAreaId?: string;
  locationCityId?: string;
}

interface LocationState extends LocationCoords {
  isReady: boolean;
  setFromGps: (lat: number, lng: number, label?: string) => void;
  setManual: (lat: number, lng: number, label: string) => void;
  setFromMaster: (coords: Omit<LocationCoords, 'source'>) => void;
  setDefault: (lat: number, lng: number, label: string) => void;
  /** @deprecated Use setManual — kept for legacy ui-store consumers */
  setLocation: (lat: number, lng: number, label: string) => void;
  resetLocation: () => void;
  clear: () => void;
}

const EMPTY: LocationCoords & { isReady: boolean } = {
  lat: 0,
  lng: 0,
  label: '',
  source: 'default',
  isReady: false,
};

/** Delhi default coords — used for store discovery until user picks a location */
export const FALLBACK_LOCATIONS = [
  { label: 'Connaught Place, Delhi', lat: 28.6139, lng: 77.209, pincode: '110001' },
  { label: 'Cyber City, Gurgaon', lat: 28.4941, lng: 77.0886, pincode: '122002' },
  { label: 'Sector 18, Noida', lat: 28.5706, lng: 77.3219, pincode: '201301' },
] as const;

export const DEFAULT_LOCATION = FALLBACK_LOCATIONS[0];

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      ...EMPTY,
      setFromGps: (lat, lng, label = 'Current location') =>
        set({ lat, lng, label, source: 'gps', isReady: true }),
      setManual: (lat, lng, label) =>
        set({ lat, lng, label, source: 'manual', isReady: true }),
      setFromMaster: (coords) =>
        set({
          ...coords,
          source: 'master',
          isReady: true,
        }),
      setDefault: (lat, lng, label) =>
        set({ lat, lng, label, source: 'default', isReady: true }),
      setLocation: (lat, lng, label) =>
        set({ lat, lng, label, source: 'manual', isReady: true }),
      resetLocation: () => set({ ...DEFAULT_LOCATION, source: 'default', isReady: true }),
      clear: () => set(EMPTY),
    }),
    {
      name: 'jebdekho-location-v3',
      version: 3,
      migrate: (persisted, version) => {
        const state = persisted as LocationCoords & { isReady?: boolean };
        if (version < 3 && state.lat && state.lng && state.label && !state.isReady) {
          state.isReady = true;
        }
        return persisted;
      },
      onRehydrateStorage: () => (state) => {
        if (typeof window === 'undefined' || !state) return;
        if (!state.isReady && state.lat && state.lng && state.label) {
          useLocationStore.setState({ isReady: true });
        }
        if (state.isReady) return;
        try {
          const raw = localStorage.getItem('jebdekho-location');
          if (!raw) return;
          const parsed = JSON.parse(raw) as {
            state?: { lat?: number; lng?: number; label?: string };
            lat?: number;
            lng?: number;
            label?: string;
          };
          const data = parsed.state ?? parsed;
          if (data.lat && data.lng && data.label) {
            useLocationStore.getState().setManual(data.lat, data.lng, data.label);
          }
        } catch {
          /* ignore legacy parse errors */
        }
      },
    },
  ),
);

/** True after persisted delivery location has been read from localStorage. */
export function useLocationHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    typeof window === 'undefined' ? false : useLocationStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useLocationStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useLocationStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

/** Saved delivery location for browsing — never silently falls back to Delhi for APIs. */
export function useEffectiveLocation() {
  const hydrated = useLocationHydrated();
  const { lat, lng, label, pincode, city, area, isReady } = useLocationStore();
  const hasLocation = hydrated && isReady && Boolean(lat) && Boolean(lng);

  return {
    hydrated,
    isReady: hasLocation,
    lat: hasLocation ? lat : undefined,
    lng: hasLocation ? lng : undefined,
    label: hasLocation && label ? label : 'Set delivery location',
    pincode: hasLocation ? pincode : undefined,
    city: hasLocation ? city : undefined,
    area: hasLocation ? area : undefined,
    mapCenter: hasLocation ? { lat: lat!, lng: lng! } : DEFAULT_LOCATION,
  };
}

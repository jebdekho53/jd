import { create } from 'zustand';

interface LocationState {
  lat: number | null;
  lng: number | null;
  pincode: string | null;
  label: string | null;
  permissionDenied: boolean;
  setLocation: (input: { lat: number; lng: number; pincode?: string | null; label?: string | null }) => void;
  setPermissionDenied: () => void;
}

/** Falls back to a Delhi coordinate when location is denied so browse/search
 *  still return something rather than being permanently blocked. */
export const DEFAULT_COORDS = { lat: 28.6139, lng: 77.209 };

export const useLocationStore = create<LocationState>()((set) => ({
  lat: null,
  lng: null,
  pincode: null,
  label: null,
  permissionDenied: false,
  setLocation: ({ lat, lng, pincode, label }) =>
    set({ lat, lng, pincode: pincode ?? null, label: label ?? null, permissionDenied: false }),
  setPermissionDenied: () =>
    set({ lat: DEFAULT_COORDS.lat, lng: DEFAULT_COORDS.lng, permissionDenied: true }),
}));

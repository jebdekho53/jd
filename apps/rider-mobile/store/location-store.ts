import { create } from 'zustand';
import type { QueuedLocationUpdate } from '@/types/location';

const UI_THROTTLE_MS = 1_000;

interface LocationState {
  currentLat: number | null;
  currentLng: number | null;
  accuracy: number | null;
  lastSyncedAt: string | null;
  isTracking: boolean;
  offlineQueue: QueuedLocationUpdate[];
  setPosition: (lat: number, lng: number, accuracy?: number | null) => void;
  setSynced: (at: string) => void;
  setTracking: (v: boolean) => void;
  enqueue: (update: QueuedLocationUpdate) => void;
  dequeue: (id: string) => void;
  clearQueue: () => void;
}

let throttleTimer: ReturnType<typeof setTimeout> | null = null;
let pending: { lat: number; lng: number; accuracy: number | null } | null = null;

function flushPending(set: (partial: Partial<LocationState>) => void) {
  if (!pending) return;
  const { lat, lng, accuracy } = pending;
  pending = null;
  throttleTimer = null;
  set({ currentLat: lat, currentLng: lng, accuracy });
}

export const useLocationStore = create<LocationState>()((set) => ({
  currentLat: null,
  currentLng: null,
  accuracy: null,
  lastSyncedAt: null,
  isTracking: false,
  offlineQueue: [],

  setPosition: (lat, lng, accuracy = null) => {
    pending = { lat, lng, accuracy };
    if (!throttleTimer) {
      flushPending(set);
      throttleTimer = setTimeout(() => flushPending(set), UI_THROTTLE_MS);
    }
  },

  setSynced: (lastSyncedAt) => set({ lastSyncedAt }),

  setTracking: (isTracking) => set({ isTracking }),

  enqueue: (update) =>
    set((s) => ({ offlineQueue: [...s.offlineQueue, update] })),

  dequeue: (id) =>
    set((s) => ({ offlineQueue: s.offlineQueue.filter((u) => u.id !== id) })),

  clearQueue: () => set({ offlineQueue: [] }),
}));

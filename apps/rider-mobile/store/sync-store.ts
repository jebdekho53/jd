import { create } from 'zustand';

interface SyncState {
  pendingCount: number;
  deadLetterCount: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
  setStats: (pending: number, deadLetter: number) => void;
  setSyncing: (v: boolean) => void;
  setLastSync: (at: string) => void;
}

export const useSyncStore = create<SyncState>()((set) => ({
  pendingCount: 0,
  deadLetterCount: 0,
  isSyncing: false,
  lastSyncAt: null,
  setStats: (pendingCount, deadLetterCount) => set({ pendingCount, deadLetterCount }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSync: (lastSyncAt) => set({ lastSyncAt }),
}));

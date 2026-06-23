import { create } from 'zustand';
import type { AuthUser, RiderProfile } from '@/types/rider';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  profile: RiderProfile | null;
  status: AuthStatus;
  setSession: (user: AuthUser, profile: RiderProfile | null) => void;
  setProfile: (profile: RiderProfile) => void;
  clearSession: () => void;
  setLoading: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  profile: null,
  status: 'idle',
  setSession: (user, profile) => set({ user, profile, status: 'authenticated' }),
  setProfile: (profile) => set({ profile }),
  clearSession: () => set({ user: null, profile: null, status: 'unauthenticated' }),
  setLoading: () => set({ status: 'loading' }),
}));

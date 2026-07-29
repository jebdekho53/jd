import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setSession: (user: AuthUser) => void;
  clearSession: () => void;
  setLoading: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'idle',
  setSession: (user) => set({ user, status: 'authenticated' }),
  clearSession: () => set({ user: null, status: 'unauthenticated' }),
  setLoading: () => set({ status: 'loading' }),
}));

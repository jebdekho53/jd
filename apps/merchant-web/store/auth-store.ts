import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  setSession: (user: AuthUser) => void;
  clearSession: () => void;
  setLoading: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: 'idle',
      setSession: (user) => set({ user, status: 'authenticated' }),
      clearSession: () => set({ user: null, status: 'unauthenticated' }),
      setLoading: () => set({ status: 'loading' }),
    }),
    {
      name: 'jd-merchant-auth',
      partialize: (s) => ({ user: s.user }),
    },
  ),
);

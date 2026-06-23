import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  isNewUser: boolean;
  needsOnboarding: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setSession: (user: AuthUser, isNewUser?: boolean) => void;
  clearSession: () => void;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      isNewUser: false,
      needsOnboarding: false,
      setUser: (user) =>
        set({ user, isAuthenticated: Boolean(user), loading: false }),
      setLoading: (loading) => set({ loading }),
      setSession: (user, isNewUser = false) =>
        set({
          user,
          isAuthenticated: true,
          loading: false,
          isNewUser,
          needsOnboarding: isNewUser,
        }),
      clearSession: () =>
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          isNewUser: false,
          needsOnboarding: false,
        }),
      completeOnboarding: () => set({ needsOnboarding: false, isNewUser: false }),
    }),
    {
      name: 'jebdekho-auth-meta',
      partialize: (s) => ({
        needsOnboarding: s.needsOnboarding,
        isNewUser: s.isNewUser,
      }),
    },
  ),
);

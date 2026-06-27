import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';

interface AuthState {
  user: AuthUser | null;
  lastKnownUser: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  sessionOffline: boolean;
  isNewUser: boolean;
  needsOnboarding: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setSessionOffline: (offline: boolean) => void;
  setSession: (user: AuthUser, isNewUser?: boolean) => void;
  clearSession: () => void;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      lastKnownUser: null,
      isAuthenticated: false,
      loading: true,
      sessionOffline: false,
      isNewUser: false,
      needsOnboarding: false,
      setUser: (user) =>
        set((state) => ({
          user,
          lastKnownUser: user ?? state.lastKnownUser,
          isAuthenticated: Boolean(user),
          loading: false,
          sessionOffline: false,
        })),
      setLoading: (loading) => set({ loading }),
      setSessionOffline: (sessionOffline) => set({ sessionOffline }),
      setSession: (user, isNewUser = false) =>
        set({
          user,
          lastKnownUser: user,
          isAuthenticated: true,
          loading: false,
          sessionOffline: false,
          isNewUser,
          needsOnboarding: isNewUser,
        }),
      clearSession: () =>
        set({
          user: null,
          lastKnownUser: null,
          isAuthenticated: false,
          loading: false,
          sessionOffline: false,
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
        lastKnownUser: s.lastKnownUser,
      }),
    },
  ),
);

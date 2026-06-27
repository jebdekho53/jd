'use client';

import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMe, useLogoutMutation } from '@/hooks/use-auth';
import { getQueryClient } from '@/lib/query-client';
import { mergeGuestCartIntoServer } from '@/lib/merge-guest-cart';
import { isAuthExpiredError, isOfflineSessionError } from '@/lib/auth/offline-session';
import { useAuthStore } from '@/store/auth-store';
import { useProfileStore } from '@/store/profile-store';
import type { AuthUser } from '@/types/auth';

interface AuthContextValue {
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { setUser, setLoading, clearSession, setSessionOffline } = useAuthStore();
  const logoutMutation = useLogoutMutation();

  const refreshSession = useCallback(async () => {
    setLoading(true);
    setSessionOffline(false);
    try {
      const user = await fetchMe();
      if (user) {
        setUser(user);
        void mergeGuestCartIntoServer(getQueryClient());
      } else {
        clearSession();
      }
    } catch (err) {
      if (isAuthExpiredError(err)) {
        clearSession();
      } else if (isOfflineSessionError(err)) {
        const cached = useAuthStore.getState().lastKnownUser;
        if (cached) {
          setUser(cached);
        } else {
          setLoading(false);
        }
        setSessionOffline(true);
      } else {
        setLoading(false);
      }
    }
  }, [setUser, setLoading, clearSession, setSessionOffline]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    const retryWhenOnline = () => {
      if (navigator.onLine) {
        void refreshSession();
      }
    };
    window.addEventListener('online', retryWhenOnline);
    return () => window.removeEventListener('online', retryWhenOnline);
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      clearSession();
      useProfileStore.getState().reset();
      queryClient.clear();
    }
  }, [logoutMutation, clearSession, queryClient]);

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      const input = args[0];
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input instanceof Request
              ? input.url
              : '';
      if (res.status === 401 && url.endsWith('/api/auth/refresh')) {
        clearSession();
      }
      return res;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Call after successful OTP verify */
export function applyAuthSession(user: AuthUser, isNewUser: boolean) {
  useAuthStore.getState().setSession(user, isNewUser);
}

'use client';

import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchMe, useLogoutMutation } from '@/hooks/use-auth';
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
  const { setUser, setLoading, clearSession } = useAuthStore();
  const logoutMutation = useLogoutMutation();

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const user = await fetchMe();
      setUser(user);
    } catch {
      clearSession();
    }
  }, [setUser, setLoading, clearSession]);

  useEffect(() => {
    refreshSession();
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
      if (
        res.status === 401 &&
        (url.endsWith('/api/auth/me') || url.endsWith('/api/auth/refresh'))
      ) {
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

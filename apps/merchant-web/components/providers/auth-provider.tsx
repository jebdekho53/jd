'use client';

import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useSessionQuery } from '@/hooks/use-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setSession, clearSession } = useAuthStore();
  const { data: user, status, error } = useSessionQuery();

  useEffect(() => {
    if (status === 'success' && user) {
      setSession(user);
    } else if (status === 'error') {
      clearSession();
    }
  }, [status, user, error, setSession, clearSession]);

  return <>{children}</>;
}

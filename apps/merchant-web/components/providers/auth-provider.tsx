'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSessionQuery } from '@/hooks/use-auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setSession, clearSession } = useAuthStore();
  const skipSessionFetch = pathname === '/login' || pathname === '/signup';
  const { data: user, status } = useSessionQuery(!skipSessionFetch);

  useEffect(() => {
    if (status === 'success') {
      if (user) setSession(user);
      else clearSession();
    }
  }, [status, user, setSession, clearSession]);

  return <>{children}</>;
}

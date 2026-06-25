'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSessionQuery } from '@/hooks/use-auth';
import { Spinner } from '@/design-system/primitives';
import { fetchOnboardingStatus } from '@/services/onboarding/onboarding-api';
import { refreshSession } from '@/services/auth/auth-api';

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, setSession } = useAuthStore();
  const { status, data, refetch } = useSessionQuery();
  const [syncingRole, setSyncingRole] = useState(false);

  const sessionUser = data ?? user;
  const isMerchant = sessionUser?.roles.includes('MERCHANT') ?? false;

  useEffect(() => {
    if (status === 'pending' || syncingRole) return;
    if (!sessionUser) {
      router.replace('/login');
      return;
    }
    if (!isMerchant) {
      void (async () => {
        try {
          const appStatus = await fetchOnboardingStatus();
          if (appStatus.storeStatus === 'APPROVED') {
            setSyncingRole(true);
            const refreshed = await refreshSession();
            if (refreshed?.roles.includes('MERCHANT')) {
              setSession(refreshed);
              await refetch();
              setSyncingRole(false);
              return;
            }
            setSyncingRole(false);
          }
          router.replace(appStatus.hasApplication ? '/onboarding' : '/signup');
        } catch {
          router.replace('/signup');
        }
      })();
    }
  }, [status, sessionUser, isMerchant, router, syncingRole, setSession, refetch]);

  if (status === 'pending' || syncingRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (!sessionUser || !isMerchant) {
    return null;
  }

  return <>{children}</>;
}

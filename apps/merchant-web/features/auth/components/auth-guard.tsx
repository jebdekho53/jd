'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSessionQuery } from '@/hooks/use-auth';
import { Spinner } from '@/design-system/primitives';
import { fetchOnboardingStatus } from '@/services/onboarding/onboarding-api';

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { status, data } = useSessionQuery();

  const sessionUser = data ?? user;
  const isMerchant = sessionUser?.roles.includes('MERCHANT') ?? false;

  useEffect(() => {
    if (status === 'pending') return;
    if (!sessionUser) {
      router.replace('/login');
      return;
    }
    if (!isMerchant) {
      void (async () => {
        try {
          const appStatus = await fetchOnboardingStatus();
          router.replace(appStatus.hasApplication ? '/onboarding' : '/signup');
        } catch {
          router.replace('/signup');
        }
      })();
    }
  }, [status, sessionUser, isMerchant, router]);

  if (status === 'pending') {
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

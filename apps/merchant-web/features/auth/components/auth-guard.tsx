'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSessionQuery } from '@/hooks/use-auth';
import { Spinner } from '@/design-system/primitives';

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { status, data } = useSessionQuery();

  const isMerchant = (data ?? user)?.roles.includes('MERCHANT') ?? false;

  useEffect(() => {
    if (status === 'error') {
      router.replace('/login');
      return;
    }
    if (status === 'success' && data && !isMerchant) {
      router.replace('/signup');
    }
  }, [status, data, isMerchant, router]);

  if (status === 'pending') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" className="text-brand-600" />
      </div>
    );
  }

  if (status === 'error' || (status === 'success' && !isMerchant)) {
    return null;
  }

  return <>{children}</>;
}

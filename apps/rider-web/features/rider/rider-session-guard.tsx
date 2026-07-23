'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/lib/api';

/**
 * Gate for every signed-in rider route.
 *
 * It deliberately returns a placeholder instead of `children` while the session
 * is unresolved. React only mounts an element when it is actually rendered, so
 * withholding it here stops each page's own `useQuery` calls from firing — the
 * reason the previous in-page guard still leaked a burst of 401s on a
 * signed-out visit.
 */
export function RiderSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe, retry: false });

  useEffect(() => {
    if (session.isLoading) return;
    if (session.isError || !session.data) {
      router.replace('/login');
      return;
    }
    if (!session.data.isRider) router.replace('/onboarding');
  }, [router, session.data, session.isError, session.isLoading]);

  if (session.isLoading || session.isError || !session.data?.isRider) {
    return (
      <div className="grid min-h-screen place-items-center bg-rider-bg text-rider-muted">
        {session.isLoading ? 'Loading…' : 'Redirecting…'}
      </div>
    );
  }

  return (
    <>
      {session.data.restricted && (
        <div className="sticky top-0 z-40 bg-rider-danger px-4 py-3 text-sm text-white">
          <p className="font-black">Account restricted</p>
          <p className="mt-0.5 text-white/90">
            {session.data.restrictionReason ?? 'Contact support for details.'} You cannot go
            online or accept deliveries until this is resolved.{' '}
            <a href="/support" className="font-bold underline">
              Contact support
            </a>
          </p>
        </div>
      )}
      {children}
    </>
  );
}

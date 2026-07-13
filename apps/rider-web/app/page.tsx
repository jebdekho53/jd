'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '@/lib/api';
import { RiderLogin } from '@/features/auth/rider-login';
import { RiderSignup } from '@/features/auth/rider-signup';
import { RiderHome } from '@/features/rider/rider-home';

export default function Page() {
  const qc = useQueryClient();
  const session = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe, retry: false });
  const refetchMe = () => qc.invalidateQueries({ queryKey: ['rider', 'me'] });
  const resetSession = () => {
    qc.clear();
    refetchMe();
  };

  if (session.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">Loading…</div>;
  }

  // Not authenticated → login.
  if (session.isError || !session.data) {
    return <RiderLogin onLoggedIn={refetchMe} />;
  }

  // Authenticated but not yet a rider → signup / onboarding.
  if (!session.data.isRider) {
    return (
      <RiderSignup phone={session.data.user.phone} onDone={refetchMe} onSignOut={resetSession} />
    );
  }

  return <RiderHome onLoggedOut={resetSession} />;
}

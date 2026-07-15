'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '@/lib/api';
import { RiderSignup } from '@/features/auth/rider-signup';

export default function OnboardingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe, retry: false });

  if (me.isLoading) return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">Loading...</div>;
  if (me.isError || !me.data) {
    router.replace('/login');
    return null;
  }
  if (me.data.isRider) {
    router.replace('/home');
    return null;
  }

  return (
    <RiderSignup
      phone={me.data.user.phone}
      onDone={() => {
        qc.invalidateQueries({ queryKey: ['rider', 'me'] });
        router.replace('/home');
      }}
      onSignOut={() => {
        qc.clear();
        router.replace('/login');
      }}
    />
  );
}

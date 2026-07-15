'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '@/lib/api';

export default function Page() {
  const router = useRouter();
  const session = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe, retry: false });

  useEffect(() => {
    if (session.isLoading) return;
    if (session.isError || !session.data) {
      router.replace('/login');
      return;
    }
    if (!session.data.isRider) {
      router.replace('/onboarding');
      return;
    }
    router.replace('/home');
  }, [router, session.data, session.isError, session.isLoading]);

  return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">Opening rider app...</div>;
}

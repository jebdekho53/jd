'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '@/lib/api';
import { RiderLogin } from '@/features/auth/rider-login';
import { RiderHome } from '@/features/rider/rider-home';

export default function Page() {
  const qc = useQueryClient();
  const session = useQuery({ queryKey: ['rider', 'me'], queryFn: getMe, retry: false });

  if (session.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">Loading…</div>;
  }

  if (session.isError || !session.data) {
    return <RiderLogin onLoggedIn={() => qc.invalidateQueries({ queryKey: ['rider', 'me'] })} />;
  }

  return (
    <RiderHome
      onLoggedOut={() => {
        qc.clear();
        qc.invalidateQueries({ queryKey: ['rider', 'me'] });
      }}
    />
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RiderLogin } from '@/features/auth/rider-login';

export default function LoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  return (
    <RiderLogin
      onLoggedIn={() => {
        qc.invalidateQueries({ queryKey: ['rider', 'me'] });
        router.replace('/');
      }}
    />
  );
}

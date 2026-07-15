'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RiderHome } from '@/features/rider/rider-home';

export default function AccountPage() {
  const qc = useQueryClient();
  return <RiderHome initialTab="account" onLoggedOut={() => qc.clear()} />;
}

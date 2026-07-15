'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RiderHome } from '@/features/rider/rider-home';

export default function HomePage() {
  const qc = useQueryClient();
  return <RiderHome initialTab="home" onLoggedOut={() => qc.clear()} />;
}

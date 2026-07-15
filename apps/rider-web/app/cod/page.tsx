'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RiderHome } from '@/features/rider/rider-home';

export default function CodPage() {
  const qc = useQueryClient();
  return <RiderHome initialTab="earnings" onLoggedOut={() => qc.clear()} />;
}

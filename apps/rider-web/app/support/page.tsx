'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RiderHome } from '@/features/rider/rider-home';

export default function SupportPage() {
  const qc = useQueryClient();
  return <RiderHome initialTab="support" onLoggedOut={() => qc.clear()} />;
}

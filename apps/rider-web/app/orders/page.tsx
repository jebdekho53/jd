'use client';

import { useQueryClient } from '@tanstack/react-query';
import { RiderHome } from '@/features/rider/rider-home';

export default function OrdersPage() {
  const qc = useQueryClient();
  return <RiderHome initialTab="orders" onLoggedOut={() => qc.clear()} />;
}

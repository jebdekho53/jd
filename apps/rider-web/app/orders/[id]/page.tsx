'use client';

import { use } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RiderHome } from '@/features/rider/rider-home';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  return <RiderHome initialTab="orders" initialOrderId={id} onLoggedOut={() => qc.clear()} />;
}

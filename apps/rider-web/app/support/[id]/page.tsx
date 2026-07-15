'use client';

import { use } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RiderHome } from '@/features/rider/rider-home';

export default function SupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  return <RiderHome initialTab="support" initialTicketId={id} onLoggedOut={() => qc.clear()} />;
}

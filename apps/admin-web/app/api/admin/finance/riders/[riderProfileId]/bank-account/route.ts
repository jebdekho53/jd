import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ riderProfileId: string }> }) {
  const { riderProfileId } = await params;
  return proxyGet(`/admin/finance/riders/${riderProfileId}/bank-account`);
}

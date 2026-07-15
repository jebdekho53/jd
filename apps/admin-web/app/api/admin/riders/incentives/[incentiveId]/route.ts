import { NextRequest } from 'next/server';
import { proxyPatch } from '@/lib/auth/bff-proxy';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ incentiveId: string }> }) {
  const { incentiveId } = await params;
  return proxyPatch(req, `/admin/riders/incentives/${incentiveId}`);
}

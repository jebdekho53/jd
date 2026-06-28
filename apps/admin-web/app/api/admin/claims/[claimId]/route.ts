import { NextRequest } from 'next/server';
import { proxyPatch } from '@/lib/auth/bff-proxy';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await params;
  return proxyPatch(req, `/admin/claims/${claimId}`);
}

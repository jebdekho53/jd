import { NextRequest } from 'next/server';
import { proxyGet, proxyPatch } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  return proxyGet('/merchant/claims', req.nextUrl.searchParams);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ claimId: string }> }) {
  const { claimId } = await params;
  return proxyPatch(req, `/merchant/claims/${claimId}`);
}

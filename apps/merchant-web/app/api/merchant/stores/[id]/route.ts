import { NextRequest } from 'next/server';
import { proxyGet, proxyPatch } from '@/lib/auth/bff-proxy';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyGet(`/merchant/stores/${id}`);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPatch(req, `/merchant/stores/${id}`);
}

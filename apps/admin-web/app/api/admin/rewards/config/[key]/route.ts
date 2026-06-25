import { proxyGet, proxyPatch } from '@/lib/auth/bff-proxy';
import { NextRequest } from 'next/server';

export async function GET() {
  return proxyGet('/admin/rewards/config');
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return proxyPatch(req, `/admin/rewards/config/${key}`);
}

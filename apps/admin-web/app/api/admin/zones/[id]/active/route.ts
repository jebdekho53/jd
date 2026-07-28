import { proxyPatch } from '@/lib/auth/bff-proxy';
import type { NextRequest } from 'next/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyPatch(req, `/admin/geo/zones/${id}/active`);
}

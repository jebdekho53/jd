import { NextRequest } from 'next/server';
import { proxyPatch } from '@/lib/auth/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPatch(req, `/rider/orders/${id}/picked-up`);
}

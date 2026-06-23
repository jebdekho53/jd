import { NextRequest } from 'next/server';
import { proxyPatch } from '@/lib/auth/session';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyPatch(req, `/rider/orders/${id}/arrived-store`);
}

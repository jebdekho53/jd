import { NextRequest } from 'next/server';
import { proxyPatch } from '@/lib/auth/bff-proxy';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyPatch(req, `/merchant/estimates/${id}/status`);
}

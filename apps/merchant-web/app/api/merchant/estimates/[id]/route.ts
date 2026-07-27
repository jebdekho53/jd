import { NextRequest } from 'next/server';
import { proxyGet, proxyPatch } from '@/lib/auth/bff-proxy';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyGet(`/merchant/estimates/${id}`);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyPatch(req, `/merchant/estimates/${id}`);
}

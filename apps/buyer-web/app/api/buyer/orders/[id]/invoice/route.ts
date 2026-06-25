import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyGet(`/buyer/orders/${id}/invoice`);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return proxyPost(req, `/buyer/orders/${id}/invoice/email`, {});
}

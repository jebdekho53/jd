import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  return proxyGet(`/merchant/ai/${sub}`, req.nextUrl.searchParams);
}

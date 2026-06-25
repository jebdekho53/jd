import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const path = `/admin/analytics/${segments.join('/')}`;
  return proxyGet(path, req.nextUrl.searchParams);
}

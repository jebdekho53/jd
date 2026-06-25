import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  return proxyGet(`/buyer/plus/${segments.join('/')}`, req.nextUrl.searchParams);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  return proxyPost(req, `/buyer/plus/${segments.join('/')}`);
}

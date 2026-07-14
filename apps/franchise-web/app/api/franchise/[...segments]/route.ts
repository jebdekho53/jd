import { NextRequest } from 'next/server';
import { proxyGet, proxyPatch, proxyPost } from '@/lib/auth/session';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  return proxyGet(`/franchise/${sub}`, req.nextUrl.searchParams, req);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  return proxyPost(req, `/franchise/${segments.join('/')}`);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  return proxyPatch(req, `/franchise/${segments.join('/')}`);
}

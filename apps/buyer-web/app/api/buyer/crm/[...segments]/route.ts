import { NextRequest } from 'next/server';
import { proxyGet, proxyPost, proxyPatch } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  if (sub === 'preferences') return proxyGet('/buyer/crm/preferences');
  if (sub === 'recommendations') return proxyGet('/buyer/crm/recommendations', req.nextUrl.searchParams);
  if (sub === 'notifications') return proxyGet('/buyer/crm/notifications', req.nextUrl.searchParams);
  return proxyGet(`/buyer/crm/${sub}`, req.nextUrl.searchParams);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  if (sub === 'preferences') return proxyPatch(req, '/buyer/crm/preferences');
  return proxyPatch(req, `/buyer/crm/${sub}`);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  if (sub === 'events') return proxyPost(req, '/buyer/crm/events');
  return proxyPost(req, `/buyer/crm/${sub}`);
}

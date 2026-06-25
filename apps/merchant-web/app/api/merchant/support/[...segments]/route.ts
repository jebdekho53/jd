import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments?.join('/') ?? '';
  if (sub === 'tickets') return proxyGet('/merchant/support/tickets', req.nextUrl.searchParams);
  if (sub === 'articles') return proxyGet('/merchant/support/articles', req.nextUrl.searchParams);
  if (sub.startsWith('tickets/')) {
    return proxyGet(`/merchant/support/tickets/${sub.replace('tickets/', '')}`);
  }
  return proxyGet(`/merchant/support/${sub}`, req.nextUrl.searchParams);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments?.join('/') ?? '';
  if (sub === 'tickets') return proxyPost(req, '/merchant/support/tickets');
  if (sub.endsWith('/reply')) {
    const id = sub.replace('tickets/', '').replace('/reply', '');
    return proxyPost(req, `/merchant/support/tickets/${id}/reply`);
  }
  return proxyPost(req, `/merchant/support/${sub}`);
}

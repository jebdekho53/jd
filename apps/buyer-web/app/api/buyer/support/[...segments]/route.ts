import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  if (sub === 'categories') return proxyGet('/buyer/support/categories');
  if (sub === 'articles') return proxyGet('/buyer/support/articles', req.nextUrl.searchParams);
  if (sub === 'tickets') return proxyGet('/buyer/support/tickets', req.nextUrl.searchParams);
  if (sub.startsWith('tickets/')) {
    const rest = sub.replace('tickets/', '');
    if (!rest.includes('/')) {
      return proxyGet(`/buyer/support/tickets/${rest}`);
    }
  }
  return proxyGet(`/buyer/support/${sub}`, req.nextUrl.searchParams);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  if (sub === 'tickets') return proxyPost(req, '/buyer/support/tickets');
  if (sub.endsWith('/reply')) {
    const id = sub.replace('tickets/', '').replace('/reply', '');
    return proxyPost(req, `/buyer/support/tickets/${id}/reply`);
  }
  if (sub.endsWith('/feedback')) {
    const id = sub.replace('tickets/', '').replace('/feedback', '');
    return proxyPost(req, `/buyer/support/tickets/${id}/feedback`);
  }
  return proxyPost(req, `/buyer/support/${sub}`);
}

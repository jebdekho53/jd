import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  const base = '/admin/support-center';
  const map: Record<string, string> = {
    overview: `${base}/overview`,
    tickets: `${base}/tickets`,
    knowledge: `${base}/knowledge`,
    'tickets/open': `${base}/tickets/open`,
    'tickets/escalated': `${base}/tickets/escalated`,
    'tickets/high-priority': `${base}/tickets/high-priority`,
    'tickets/refund-related': `${base}/tickets/refund-related`,
    'tickets/finance-related': `${base}/tickets/finance-related`,
    'tickets/merchant-related': `${base}/tickets/merchant-related`,
    'tickets/rider-related': `${base}/tickets/rider-related`,
  };
  if (map[sub]) {
    return proxyGet(map[sub], req.nextUrl.searchParams);
  }
  if (sub.startsWith('tickets/') && !sub.includes('/reply') && !sub.includes('/resolve')) {
    return proxyGet(`${base}/tickets/${sub.replace('tickets/', '')}`, req.nextUrl.searchParams);
  }
  return proxyGet(`${base}/${sub}`, req.nextUrl.searchParams);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  const base = '/admin/support-center';
  if (sub.endsWith('/reply')) {
    const id = sub.replace('tickets/', '').replace('/reply', '');
    return proxyPost(req, `${base}/tickets/${id}/reply`);
  }
  if (sub.endsWith('/resolve')) {
    const id = sub.replace('tickets/', '').replace('/resolve', '');
    return proxyPost(req, `${base}/tickets/${id}/resolve`);
  }
  return proxyPost(req, `${base}/${sub}`);
}

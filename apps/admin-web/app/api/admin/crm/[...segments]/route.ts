import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  const base = '/admin/crm';
  const map: Record<string, string> = {
    overview: `${base}/overview`,
    segments: `${base}/segments`,
    journeys: `${base}/journeys`,
    campaigns: `${base}/campaigns`,
    templates: `${base}/templates`,
    'notifications/deliveries': `${base}/notifications/deliveries`,
  };
  if (map[sub]) return proxyGet(map[sub], req.nextUrl.searchParams);
  if (sub.startsWith('segments/') && sub.endsWith('/members')) {
    const id = sub.replace('segments/', '').replace('/members', '');
    return proxyGet(`${base}/segments/${id}/members`, req.nextUrl.searchParams);
  }
  if (sub.startsWith('customers/')) {
    return proxyGet(`${base}/customers/${sub.replace('customers/', '')}`);
  }
  return proxyGet(`${base}/${sub}`, req.nextUrl.searchParams);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  if (sub === 'campaigns/push') return proxyPost(req, '/admin/crm/campaigns/push');
  if (sub.startsWith('segments/') && sub.endsWith('/refresh')) {
    const id = sub.replace('segments/', '').replace('/refresh', '');
    return proxyPost(req, `/admin/crm/segments/${id}/refresh`);
  }
  return proxyPost(req, `/admin/crm/${sub}`);
}

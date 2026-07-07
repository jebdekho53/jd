import { NextRequest } from 'next/server';
import { proxyGet, proxyPatch, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  const map: Record<string, string> = {
    overview: '/admin/trust-safety/overview',
    alerts: '/admin/trust-safety/alerts',
    'fraud-cases': '/admin/trust-safety/fraud-cases',
    'risk-profiles': '/admin/trust-safety/risk-profiles',
    'blocked-accounts': '/admin/trust-safety/blocked-accounts',
  };
  if (sub.startsWith('fraud-cases/')) {
    return proxyGet(`/admin/trust-safety/fraud-cases/${sub.replace('fraud-cases/', '')}`, req.nextUrl.searchParams);
  }
  const apiPath = map[sub] ?? `/admin/trust-safety/${sub}`;
  return proxyGet(apiPath, req.nextUrl.searchParams);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  return proxyPost(req, `/admin/trust-safety/${segments.join('/')}`);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  return proxyPatch(req, `/admin/trust-safety/${segments.join('/')}`);
}

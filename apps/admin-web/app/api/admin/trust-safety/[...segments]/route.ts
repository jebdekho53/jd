import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

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

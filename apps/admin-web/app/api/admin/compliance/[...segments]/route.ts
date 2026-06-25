import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');

  if (sub.startsWith('reports/')) {
    return proxyGet(`/admin/compliance/reports/${sub.replace('reports/', '')}`, req.nextUrl.searchParams);
  }

  const map: Record<string, string> = {
    overview: '/admin/compliance/overview',
    'gst/rates': '/admin/compliance/gst/rates',
    'gst/jurisdictions': '/admin/compliance/gst/jurisdictions',
    'gst/hsn': '/admin/compliance/gst/hsn',
    invoices: '/admin/compliance/invoices',
    'credit-notes': '/admin/compliance/credit-notes',
    'debit-notes': '/admin/compliance/debit-notes',
    tds: '/admin/compliance/tds',
    tcs: '/admin/compliance/tcs',
  };

  const apiPath = map[sub] ?? `/admin/compliance/${sub}`;
  return proxyGet(apiPath, req.nextUrl.searchParams);
}

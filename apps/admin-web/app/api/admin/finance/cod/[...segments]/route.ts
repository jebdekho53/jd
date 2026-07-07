import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  // segments can be [id, 'verify'] or [id, 'reject']
  return proxyPost(req, `/admin/finance/cod/${segments.join('/')}`);
}

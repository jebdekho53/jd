import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/session';

export async function GET(req: NextRequest, ctx: { params: Promise<{ segments: string[] }> }) {
  const { segments } = await ctx.params;
  const sub = segments.join('/');
  return proxyGet(req, `/rider/fleet/${sub}`);
}

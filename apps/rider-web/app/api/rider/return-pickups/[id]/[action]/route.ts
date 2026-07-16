import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/session';

const ALLOWED = new Set(['accept', 'picked-up', 'completed', 'decline']);

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string; action: string }> }) {
  const { id, action } = await ctx.params;
  if (!ALLOWED.has(action)) {
    return new Response(JSON.stringify({ success: false, message: 'Invalid action' }), { status: 400 });
  }
  return proxyPost(req, `/rider/return-pickups/${encodeURIComponent(id)}/${action}`);
}

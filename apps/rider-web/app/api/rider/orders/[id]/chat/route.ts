import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qs = req.nextUrl.searchParams.toString();
  return proxyGet(req, `/rider/orders/${id}/chat${qs ? `?${qs}` : ''}`);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPost(req, `/rider/orders/${id}/chat`);
}

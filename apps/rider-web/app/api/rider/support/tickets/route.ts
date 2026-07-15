import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  return proxyGet(req, `/rider/support/tickets${url.search}`);
}

export async function POST(req: NextRequest) {
  return proxyPost(req, '/rider/support/tickets');
}

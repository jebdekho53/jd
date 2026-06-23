import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  return proxyGet('/merchant/stores', new URL(req.url).searchParams);
}

export async function POST(req: NextRequest) {
  return proxyPost(req, '/merchant/stores', {}, 201);
}

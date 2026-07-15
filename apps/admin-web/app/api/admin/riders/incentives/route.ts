import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: NextRequest) {
  return proxyGet('/admin/riders/incentives', req.nextUrl.searchParams);
}

export async function POST(req: NextRequest) {
  return proxyPost(req, '/admin/riders/incentives', 201);
}

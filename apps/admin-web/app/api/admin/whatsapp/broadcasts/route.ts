import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET(req: Request) {
  return proxyGet('/admin/whatsapp/broadcasts', new URL(req.url).searchParams);
}

export async function POST(req: NextRequest) {
  return proxyPost(req, '/admin/whatsapp/broadcasts', 202);
}

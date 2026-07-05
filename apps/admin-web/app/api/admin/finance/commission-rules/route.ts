import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET() {
  return proxyGet('/admin/finance/commission-rules');
}

export async function POST(req: NextRequest) {
  return proxyPost(req, '/admin/finance/commission-rules', 201);
}

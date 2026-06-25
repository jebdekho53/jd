import { NextRequest } from 'next/server';
import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';

export async function GET() {
  return proxyGet('/buyer/addresses');
}

export async function POST(req: NextRequest) {
  return proxyPost(req, '/buyer/addresses');
}

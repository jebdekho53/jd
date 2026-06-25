import { NextRequest } from 'next/server';
import { proxyDelete, proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(req: NextRequest) {
  return proxyPost(req, '/buyer/cart/coupon/validate');
}

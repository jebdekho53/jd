import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { Cart } from '@/types/cart';

export async function POST(req: NextRequest) {
  return proxyPost<Cart>(req, '/buyer/cart/items');
}

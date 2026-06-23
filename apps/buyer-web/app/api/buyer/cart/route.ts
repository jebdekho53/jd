import { NextResponse } from 'next/server';
import { proxyGet, proxyDelete } from '@/lib/auth/bff-proxy';
import type { Cart } from '@/types/cart';

export async function GET() {
  return proxyGet<Cart | null>('/buyer/cart');
}

export async function DELETE() {
  return proxyDelete<{ message: string }>('/buyer/cart');
}

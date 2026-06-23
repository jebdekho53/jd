import { NextRequest } from 'next/server';
import { proxyGet } from '@/lib/auth/bff-proxy';
import type { OrderListResponse } from '@/types/orders';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return proxyGet<OrderListResponse>('/buyer/orders', searchParams);
}

import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';
import type { OrderDetail } from '@/types/orders';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyPost<OrderDetail>(req, `/buyer/orders/${id}/cancel`);
}

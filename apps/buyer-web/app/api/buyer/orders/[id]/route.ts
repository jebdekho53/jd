import { proxyGet } from '@/lib/auth/bff-proxy';
import type { OrderDetail } from '@/types/orders';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyGet<OrderDetail>(`/buyer/orders/${id}`);
}

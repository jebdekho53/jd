import { proxyGet } from '@/lib/auth/bff-proxy';
import type { CheckoutResult } from '@/types/checkout';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyGet<CheckoutResult>(`/buyer/checkout/${id}`);
}

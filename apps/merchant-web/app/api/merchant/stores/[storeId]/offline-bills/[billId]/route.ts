import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(_req: Request, { params }: { params: Promise<{ storeId: string; billId: string }> }) {
  const { storeId, billId } = await params;
  return proxyGet(`/merchant/stores/${storeId}/offline-bills/${billId}`);
}

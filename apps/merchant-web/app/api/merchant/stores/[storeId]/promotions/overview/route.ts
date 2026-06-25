import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(_req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return proxyGet(`/merchant/stores/${storeId}/promotions/overview`);
}

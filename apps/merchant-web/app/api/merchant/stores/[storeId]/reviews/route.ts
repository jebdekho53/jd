import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(req: Request, { params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const url = new URL(req.url);
  return proxyGet(`/merchant/stores/${storeId}/reviews`, url.searchParams);
}

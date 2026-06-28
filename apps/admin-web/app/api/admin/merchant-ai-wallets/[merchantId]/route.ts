import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ merchantId: string }> },
) {
  const { merchantId } = await params;
  return proxyGet(`/admin/merchant-ai-wallets/${merchantId}`);
}

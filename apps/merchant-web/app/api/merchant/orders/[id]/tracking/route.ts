import { proxyGet } from '@/lib/auth/bff-proxy';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyGet(`/merchant/orders/${id}/tracking`);
}

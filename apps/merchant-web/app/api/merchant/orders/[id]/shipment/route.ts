import { proxyGet, proxyPost } from '@/lib/auth/bff-proxy';
import { merchantShipmentPath } from '@/lib/bff/logistics-paths';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyGet(merchantShipmentPath(id));
}

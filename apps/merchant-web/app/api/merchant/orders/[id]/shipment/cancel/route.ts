import { proxyPost } from '@/lib/auth/bff-proxy';
import { merchantShipmentCancelPath } from '@/lib/bff/logistics-paths';
import type { NextRequest } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyPost(req, merchantShipmentCancelPath(id));
}

import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; businessType: string; action: string }> },
) {
  const { storeId, businessType, action } = await params;
  return proxyPost(req, `/admin/restaurant-ops/approvals/${storeId}/${businessType}/${action}`);
}

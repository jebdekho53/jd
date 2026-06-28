import { NextRequest } from 'next/server';
import { proxyPost } from '@/lib/auth/bff-proxy';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; menuItemId: string; groupId: string }> },
) {
  const { storeId, menuItemId, groupId } = await params;
  return proxyPost(req, `/merchant/stores/${storeId}/menu/items/${menuItemId}/addon-groups/${groupId}`);
}

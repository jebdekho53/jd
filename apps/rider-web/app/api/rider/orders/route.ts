import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth, errorResponse } from '@/lib/auth/session';
import { mapDeliveryDetail, mapDeliveryListItem, type BackendDelivery } from '@/lib/transforms/orders';

export async function GET(req: NextRequest) {
  try {
    const raw = await fetchWithAuth<BackendDelivery[]>('/rider/orders', { method: 'GET' }, req);
    const data = raw.map(mapDeliveryListItem);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return errorResponse(err);
  }
}

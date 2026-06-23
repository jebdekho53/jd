import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth, errorResponse } from '@/lib/auth/session';
import { mapDeliveryDetail, type BackendDelivery } from '@/lib/transforms/orders';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const raw = await fetchWithAuth<BackendDelivery>(`/rider/orders/${id}`, { method: 'GET' }, req);
    return NextResponse.json({ success: true, data: mapDeliveryDetail(raw) });
  } catch (err) {
    return errorResponse(err);
  }
}

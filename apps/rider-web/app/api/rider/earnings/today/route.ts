import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth, errorResponse } from '@/lib/auth/session';
import { startOfIstDay } from '@/lib/ist-day';
import { mapDeliveryListItem, type BackendDelivery } from '@/lib/transforms/orders';

export async function GET(req: NextRequest) {
  try {
    const raw = await fetchWithAuth<BackendDelivery[]>('/rider/orders', { method: 'GET' }, req);
    const todayStart = startOfIstDay();

    const today = raw
      .map(mapDeliveryListItem)
      .filter(
        (d) =>
          d.deliveryStatus === 'DELIVERED' && new Date(d.assignedAt) >= todayStart,
      );

    const total = today.reduce((acc, d) => acc + (d.riderEarning ?? 0), 0);

    return NextResponse.json({
      success: true,
      data: { amount: total, deliveries: today.length },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

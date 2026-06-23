import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth, errorResponse } from '@/lib/auth/session';
import { mapDeliveryListItem, type BackendDelivery } from '@/lib/transforms/orders';

export async function GET(req: NextRequest) {
  try {
    const raw = await fetchWithAuth<BackendDelivery[]>('/rider/orders', { method: 'GET' }, req);
    const history = raw
      .map(mapDeliveryListItem)
      .filter((d) => d.deliveryStatus === 'DELIVERED')
      .map((d) => ({
        orderId: d.orderId,
        orderNumber: d.orderNumber,
        amount: d.riderEarning ?? 0,
        paymentMethod: d.paymentMethod,
        completedAt: d.assignedAt,
      }));

    return NextResponse.json({ success: true, data: history });
  } catch (err) {
    return errorResponse(err);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth, errorResponse } from '@/lib/auth/session';
import { startOfIstDay, startOfIstWeek } from '@/lib/ist-day';
import { mapDeliveryListItem, type BackendDelivery } from '@/lib/transforms/orders';

async function fetchDeliveries(req: NextRequest) {
  const raw = await fetchWithAuth<BackendDelivery[]>('/rider/orders', { method: 'GET' }, req);
  return raw.map(mapDeliveryListItem);
}

export async function GET(req: NextRequest) {
  try {
    const deliveries = await fetchDeliveries(req);
    const delivered = deliveries.filter((d) => d.deliveryStatus === 'DELIVERED');
    const todayStart = startOfIstDay();
    const weekStart = startOfIstWeek();

    const today = delivered.filter((d) => new Date(d.assignedAt) >= todayStart);
    const week = delivered.filter((d) => new Date(d.assignedAt) >= weekStart);

    const sum = (items: typeof delivered) =>
      items.reduce((acc, d) => acc + (d.riderEarning ?? 0), 0);

    const cod = delivered.filter((d) => d.paymentMethod === 'COD');
    const prepaid = delivered.filter((d) => d.paymentMethod === 'RAZORPAY');

    return NextResponse.json({
      success: true,
      data: {
        today: sum(today),
        thisWeek: sum(week),
        codTotal: sum(cod),
        prepaidTotal: sum(prepaid),
        deliveryCount: delivered.length,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

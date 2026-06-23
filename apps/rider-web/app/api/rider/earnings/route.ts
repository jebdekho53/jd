import { NextRequest, NextResponse } from 'next/server';
import { fetchWithAuth, errorResponse } from '@/lib/auth/session';
import { mapDeliveryListItem, type BackendDelivery } from '@/lib/transforms/orders';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}

async function fetchDeliveries(req: NextRequest) {
  const raw = await fetchWithAuth<BackendDelivery[]>('/rider/orders', { method: 'GET' }, req);
  return raw.map(mapDeliveryListItem);
}

export async function GET(req: NextRequest) {
  try {
    const deliveries = await fetchDeliveries(req);
    const delivered = deliveries.filter((d) => d.deliveryStatus === 'DELIVERED');
    const todayStart = startOfDay();
    const weekStart = startOfWeek();

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

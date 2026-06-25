import { buyerFetch } from '@/services/api/buyer-auth-client';
import type { ApiResponse } from '@/types/buyer';
import type { LiveTrackingData } from '@/types/tracking';

export async function getOrderTracking(orderId: string): Promise<LiveTrackingData> {
  const res = await buyerFetch<ApiResponse<LiveTrackingData>>(
    `/api/buyer/orders/${orderId}/tracking`,
  );
  return res.data;
}

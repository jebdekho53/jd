import { buyerFetch } from '@/services/api/buyer-auth-client';
import type { ApiResponse } from '@/types/buyer';
import type { OrderDetail, OrderListResponse, ListOrdersParams } from '@/types/orders';

function buildQuery(params: ListOrdersParams): string {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function listOrders(params: ListOrdersParams = {}): Promise<OrderListResponse> {
  const res = await buyerFetch<ApiResponse<OrderListResponse>>(
    `/api/buyer/orders${buildQuery(params)}`,
  );
  return res.data;
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail> {
  const res = await buyerFetch<ApiResponse<OrderDetail>>(`/api/buyer/orders/${orderId}`);
  return res.data;
}

export async function cancelOrder(
  orderId: string,
  reason?: string,
): Promise<OrderDetail> {
  const res = await buyerFetch<ApiResponse<OrderDetail>>(
    `/api/buyer/orders/${orderId}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ reason: reason ?? 'Cancelled by buyer' }),
    },
  );
  return res.data;
}

import { merchantFetch } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type { OrderDetail, OrderListResponse, ListOrdersParams } from '@/types/order';

function buildQuery(params: ListOrdersParams): string {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.storeId) q.set('storeId', params.storeId);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function listOrders(params: ListOrdersParams = {}): Promise<OrderListResponse> {
  return merchantFetch<OrderListResponse>(`/api/merchant/orders${buildQuery({ limit: 30, ...params })}`);
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail> {
  const res = await merchantFetch<ApiResponse<OrderDetail>>(`/api/merchant/orders/${orderId}`);
  return res.data;
}

async function patchOrderStatus(orderId: string, action: string, reason?: string): Promise<OrderDetail> {
  const res = await merchantFetch<ApiResponse<OrderDetail>>(
    `/api/merchant/orders/${orderId}/${action}`,
    { method: 'PATCH', body: JSON.stringify(reason ? { reason } : {}) },
  );
  return res.data;
}

export const confirmOrder = (id: string) => patchOrderStatus(id, 'confirm');
export const markPreparing = (id: string) => patchOrderStatus(id, 'preparing');
export const markReady = (id: string) => patchOrderStatus(id, 'ready');
export const cancelOrder = (id: string, reason?: string) => patchOrderStatus(id, 'cancel', reason);

import { merchantFetch } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type { OrderDetail, OrderListResponse, ListOrdersParams } from '@/types/order';

function buildQuery(params: ListOrdersParams): string {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.merchantStatusGroup) q.set('merchantStatusGroup', params.merchantStatusGroup);
  if (params.pipelineColumn) q.set('pipelineColumn', params.pipelineColumn);
  if (params.storeId) q.set('storeId', params.storeId);
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.today) q.set('today', 'true');
  if (params.yesterday) q.set('yesterday', 'true');
  if (params.dateFrom) q.set('dateFrom', params.dateFrom);
  if (params.dateTo) q.set('dateTo', params.dateTo);
  if (params.paymentMethod) q.set('paymentMethod', params.paymentMethod);
  if (params.q) q.set('q', params.q);
  const s = q.toString();
  return s ? `?${s}` : '';
}

export async function listOrders(params: ListOrdersParams = {}): Promise<OrderListResponse> {
  const res = await merchantFetch<{ success: boolean; data: OrderListResponse }>(
    `/api/merchant/orders${buildQuery({ limit: 30, ...params })}`,
  );
  return res.data;
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail> {
  const res = await merchantFetch<ApiResponse<OrderDetail>>(`/api/merchant/orders/${orderId}`);
  return res.data;
}

export interface PickupOtpResult {
  pickupOtp: string | null;
  verified: boolean;
  deliveryStatus: string;
}

/** Pickup/handover OTP for this store's order (scoped server-side to the merchant). */
export async function getPickupOtp(orderId: string): Promise<PickupOtpResult> {
  const res = await merchantFetch<ApiResponse<PickupOtpResult>>(
    `/api/merchant/orders/${orderId}/pickup-otp`,
  );
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
export const markPacking = (id: string) => patchOrderStatus(id, 'packing');
export const markReady = (id: string) => patchOrderStatus(id, 'ready');
export const markIssue = (id: string, note?: string) => patchOrderStatus(id, 'issue', note);
export const cancelOrder = (id: string, reason?: string) => patchOrderStatus(id, 'cancel', reason);

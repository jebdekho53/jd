import { merchantFetch, buildQuery } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type {
  CreditLine,
  ProcurementAnalytics,
  ProcurementCart,
  ProcurementRecommendation,
  VendorOrder,
  VendorProduct,
  VendorSummary,
} from '@/types/procurement';

export async function getRecommendations(storeId: string): Promise<ProcurementRecommendation[]> {
  const res = await merchantFetch<ApiResponse<ProcurementRecommendation[]>>(
    `/api/merchant/procurement/recommendations${buildQuery({ storeId })}`,
  );
  return res.data;
}

export async function searchVendors(q?: string): Promise<VendorSummary[]> {
  const res = await merchantFetch<ApiResponse<VendorSummary[]>>(
    `/api/merchant/procurement/vendors${buildQuery({ q })}`,
  );
  return res.data;
}

export async function searchProducts(q?: string): Promise<VendorProduct[]> {
  const res = await merchantFetch<ApiResponse<VendorProduct[]>>(
    `/api/merchant/procurement/products${buildQuery({ q })}`,
  );
  return res.data;
}

export async function getCreditLines(): Promise<CreditLine[]> {
  const res = await merchantFetch<ApiResponse<CreditLine[]>>('/api/merchant/procurement/credit');
  return res.data;
}

export async function getAnalytics(storeId: string): Promise<ProcurementAnalytics> {
  const res = await merchantFetch<ApiResponse<ProcurementAnalytics>>(
    `/api/merchant/procurement/analytics${buildQuery({ storeId })}`,
  );
  return res.data;
}

export async function getCart(storeId: string): Promise<ProcurementCart> {
  const res = await merchantFetch<ApiResponse<ProcurementCart>>(
    `/api/merchant/procurement/cart${buildQuery({ storeId })}`,
  );
  return res.data;
}

export interface CartItemInput {
  vendorProductId: string;
  quantity: number;
}

/** Full-replace — there is no dedicated update-quantity or remove-item endpoint. */
export async function replaceCart(
  storeId: string,
  items: CartItemInput[],
  vendorId?: string,
): Promise<ProcurementCart> {
  const res = await merchantFetch<ApiResponse<ProcurementCart>>('/api/merchant/procurement/cart', {
    method: 'POST',
    body: JSON.stringify({ items, storeId, vendorId }),
  });
  return res.data;
}

export async function addCartItem(
  storeId: string,
  vendorProductId: string,
  quantity: number,
): Promise<ProcurementCart> {
  const res = await merchantFetch<ApiResponse<ProcurementCart>>(
    `/api/merchant/procurement/cart/items${buildQuery({ storeId })}`,
    { method: 'POST', body: JSON.stringify({ vendorProductId, quantity }) },
  );
  return res.data;
}

export async function createOrder(
  storeId: string,
  opts?: { notes?: string; useCredit?: boolean },
): Promise<VendorOrder> {
  const res = await merchantFetch<ApiResponse<VendorOrder>>('/api/merchant/procurement/orders', {
    method: 'POST',
    body: JSON.stringify({ storeId, ...opts }),
  });
  return res.data;
}

export async function listOrders(storeId: string): Promise<VendorOrder[]> {
  const res = await merchantFetch<ApiResponse<VendorOrder[]>>(
    `/api/merchant/procurement/orders${buildQuery({ storeId })}`,
  );
  return res.data;
}

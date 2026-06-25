import { merchantFetch, buildQuery } from '@/services/api/merchant-client';
import type { ApiResponse } from '@/types/auth';
import type {
  MerchantAnalyticsDashboard,
  MerchantComplianceDashboard,
  MerchantCustomersDashboard,
  MerchantInventoryDashboard,
  MerchantNotificationsDashboard,
  MerchantOrdersDashboard,
  MerchantOverview,
  MerchantRidersDashboard,
} from '@/types/dashboard';

export async function fetchMerchantOverview(storeId?: string): Promise<MerchantOverview> {
  const res = await merchantFetch<ApiResponse<MerchantOverview>>(
    `/api/merchant/dashboard/overview${buildQuery({ storeId })}`,
  );
  return res.data;
}

export async function fetchMerchantDashboardOrders(
  params: { storeId?: string; tab?: string; page?: number; limit?: number } = {},
): Promise<MerchantOrdersDashboard> {
  const res = await merchantFetch<ApiResponse<MerchantOrdersDashboard>>(
    `/api/merchant/dashboard/orders${buildQuery(params)}`,
  );
  return res.data;
}

export async function fetchMerchantInventory(storeId?: string): Promise<MerchantInventoryDashboard> {
  const res = await merchantFetch<ApiResponse<MerchantInventoryDashboard>>(
    `/api/merchant/dashboard/inventory${buildQuery({ storeId })}`,
  );
  return res.data;
}

export async function fetchMerchantRiders(storeId?: string): Promise<MerchantRidersDashboard> {
  const res = await merchantFetch<ApiResponse<MerchantRidersDashboard>>(
    `/api/merchant/dashboard/riders${buildQuery({ storeId })}`,
  );
  return res.data;
}

export async function fetchMerchantAnalytics(
  storeId?: string,
  period: '7d' | '30d' = '7d',
): Promise<MerchantAnalyticsDashboard> {
  const res = await merchantFetch<ApiResponse<MerchantAnalyticsDashboard>>(
    `/api/merchant/dashboard/analytics${buildQuery({ storeId, period })}`,
  );
  return res.data;
}

export async function fetchMerchantCustomers(storeId?: string): Promise<MerchantCustomersDashboard> {
  const res = await merchantFetch<ApiResponse<MerchantCustomersDashboard>>(
    `/api/merchant/dashboard/customers${buildQuery({ storeId })}`,
  );
  return res.data;
}

export async function fetchMerchantCompliance(storeId?: string): Promise<MerchantComplianceDashboard> {
  const res = await merchantFetch<ApiResponse<MerchantComplianceDashboard>>(
    `/api/merchant/dashboard/compliance${buildQuery({ storeId })}`,
  );
  return res.data;
}

export async function fetchMerchantNotifications(
  storeId?: string,
): Promise<MerchantNotificationsDashboard> {
  const res = await merchantFetch<ApiResponse<MerchantNotificationsDashboard>>(
    `/api/merchant/dashboard/notifications${buildQuery({ storeId })}`,
  );
  return res.data;
}

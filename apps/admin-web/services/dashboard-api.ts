import { adminFetch, buildQuery } from '@/services/api/admin-client';
import type { ApiResponse } from '@/types/admin';
import type {
  AdminCategoriesDashboard,
  AdminCustomersDashboard,
  AdminFraudDashboard,
  AdminOrdersDashboard,
  AdminOverview,
  AdminPaymentsDashboard,
  AdminRidersDashboard,
  AdminStoresDashboard,
  AdminSystemHealthDashboard,
  AdminUnassignedDashboard,
} from '@/types/dashboard';

export async function fetchAdminOverview(): Promise<AdminOverview> {
  const res = await adminFetch<ApiResponse<AdminOverview>>('/api/admin/dashboard/overview');
  return res.data;
}

export async function fetchAdminDashboardOrders(
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<AdminOrdersDashboard> {
  const res = await adminFetch<ApiResponse<AdminOrdersDashboard>>(
    `/api/admin/dashboard/orders${buildQuery(params)}`,
  );
  return res.data;
}

export async function fetchAdminStoresDashboard(
  params: Record<string, string | number | undefined> = {},
): Promise<AdminStoresDashboard> {
  const res = await adminFetch<ApiResponse<AdminStoresDashboard>>(
    `/api/admin/dashboard/stores${buildQuery(params)}`,
  );
  return res.data;
}

export async function fetchAdminRidersDashboard(): Promise<AdminRidersDashboard> {
  const res = await adminFetch<ApiResponse<AdminRidersDashboard>>('/api/admin/dashboard/riders');
  return res.data;
}

export async function fetchAdminUnassignedDashboard(): Promise<AdminUnassignedDashboard> {
  const res = await adminFetch<ApiResponse<AdminUnassignedDashboard>>(
    '/api/admin/dashboard/unassigned-orders',
  );
  return res.data;
}

export async function fetchAdminPaymentsDashboard(): Promise<AdminPaymentsDashboard> {
  const res = await adminFetch<ApiResponse<AdminPaymentsDashboard>>('/api/admin/dashboard/payments');
  return res.data;
}

export async function fetchAdminCustomersDashboard(): Promise<AdminCustomersDashboard> {
  const res = await adminFetch<ApiResponse<AdminCustomersDashboard>>('/api/admin/dashboard/customers');
  return res.data;
}

export async function fetchAdminCategoriesDashboard(): Promise<AdminCategoriesDashboard> {
  const res = await adminFetch<ApiResponse<AdminCategoriesDashboard>>('/api/admin/dashboard/categories');
  return res.data;
}

export async function fetchAdminFraudDashboard(): Promise<AdminFraudDashboard> {
  const res = await adminFetch<ApiResponse<AdminFraudDashboard>>('/api/admin/dashboard/fraud-risk');
  return res.data;
}

export async function fetchAdminSystemHealth(): Promise<AdminSystemHealthDashboard> {
  const res = await adminFetch<ApiResponse<AdminSystemHealthDashboard>>(
    '/api/admin/dashboard/system-health',
  );
  return res.data;
}

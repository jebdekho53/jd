import { useQuery } from '@tanstack/react-query';
import {
  fetchMerchantAnalytics,
  fetchMerchantCompliance,
  fetchMerchantCustomers,
  fetchMerchantDashboardOrders,
  fetchMerchantInventory,
  fetchMerchantNotifications,
  fetchMerchantOverview,
  fetchMerchantRiders,
} from '@/services/dashboard-api';

export const merchantDashboardKeys = {
  all: ['merchant-dashboard'] as const,
  overview: (storeId?: string) => [...merchantDashboardKeys.all, 'overview', storeId] as const,
  orders: (storeId?: string, tab?: string) =>
    [...merchantDashboardKeys.all, 'orders', storeId, tab] as const,
  inventory: (storeId?: string) => [...merchantDashboardKeys.all, 'inventory', storeId] as const,
  riders: (storeId?: string) => [...merchantDashboardKeys.all, 'riders', storeId] as const,
  analytics: (storeId?: string, period?: string) =>
    [...merchantDashboardKeys.all, 'analytics', storeId, period] as const,
  customers: (storeId?: string) => [...merchantDashboardKeys.all, 'customers', storeId] as const,
  compliance: (storeId?: string) => [...merchantDashboardKeys.all, 'compliance', storeId] as const,
  notifications: (storeId?: string) =>
    [...merchantDashboardKeys.all, 'notifications', storeId] as const,
};

export function useMerchantOverviewQuery(storeId?: string) {
  return useQuery({
    queryKey: merchantDashboardKeys.overview(storeId),
    queryFn: () => fetchMerchantOverview(storeId),
    refetchInterval: 60_000,
  });
}

export function useMerchantDashboardOrdersQuery(storeId?: string, tab?: string) {
  return useQuery({
    queryKey: merchantDashboardKeys.orders(storeId, tab),
    queryFn: () => fetchMerchantDashboardOrders({ storeId, tab, limit: 25 }),
    refetchInterval: 10_000,
    staleTime: 0,
  });
}

export function useMerchantInventoryDashboardQuery(storeId?: string) {
  return useQuery({
    queryKey: merchantDashboardKeys.inventory(storeId),
    queryFn: () => fetchMerchantInventory(storeId),
    refetchInterval: 60_000,
  });
}

export function useMerchantRidersDashboardQuery(storeId?: string) {
  return useQuery({
    queryKey: merchantDashboardKeys.riders(storeId),
    queryFn: () => fetchMerchantRiders(storeId),
    refetchInterval: 15_000,
  });
}

export function useMerchantAnalyticsDashboardQuery(
  storeId?: string,
  period: '7d' | '30d' = '7d',
) {
  return useQuery({
    queryKey: merchantDashboardKeys.analytics(storeId, period),
    queryFn: () => fetchMerchantAnalytics(storeId, period),
    refetchInterval: 300_000,
  });
}

export function useMerchantCustomersDashboardQuery(storeId?: string) {
  return useQuery({
    queryKey: merchantDashboardKeys.customers(storeId),
    queryFn: () => fetchMerchantCustomers(storeId),
    refetchInterval: 300_000,
  });
}

export function useMerchantComplianceDashboardQuery(storeId?: string) {
  return useQuery({
    queryKey: merchantDashboardKeys.compliance(storeId),
    queryFn: () => fetchMerchantCompliance(storeId),
    refetchInterval: 120_000,
  });
}

export function useMerchantNotificationsDashboardQuery(storeId?: string) {
  return useQuery({
    queryKey: merchantDashboardKeys.notifications(storeId),
    queryFn: () => fetchMerchantNotifications(storeId),
    refetchInterval: 30_000,
  });
}

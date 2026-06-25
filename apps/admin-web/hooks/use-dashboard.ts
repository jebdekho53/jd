import { useQuery } from '@tanstack/react-query';
import {
  fetchAdminCategoriesDashboard,
  fetchAdminCustomersDashboard,
  fetchAdminDashboardOrders,
  fetchAdminFraudDashboard,
  fetchAdminOverview,
  fetchAdminPaymentsDashboard,
  fetchAdminRidersDashboard,
  fetchAdminStoresDashboard,
  fetchAdminSystemHealth,
  fetchAdminUnassignedDashboard,
} from '@/services/dashboard-api';

export const adminDashboardKeys = {
  all: ['admin-dashboard'] as const,
  overview: () => [...adminDashboardKeys.all, 'overview'] as const,
  orders: (params?: string) => [...adminDashboardKeys.all, 'orders', params] as const,
  stores: () => [...adminDashboardKeys.all, 'stores'] as const,
  riders: () => [...adminDashboardKeys.all, 'riders'] as const,
  unassigned: () => [...adminDashboardKeys.all, 'unassigned'] as const,
  payments: () => [...adminDashboardKeys.all, 'payments'] as const,
  customers: () => [...adminDashboardKeys.all, 'customers'] as const,
  categories: () => [...adminDashboardKeys.all, 'categories'] as const,
  fraud: () => [...adminDashboardKeys.all, 'fraud'] as const,
  health: () => [...adminDashboardKeys.all, 'health'] as const,
};

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: adminDashboardKeys.overview(),
    queryFn: fetchAdminOverview,
    refetchInterval: 60_000,
  });
}

export function useAdminDashboardOrdersQuery(today = true) {
  return useQuery({
    queryKey: adminDashboardKeys.orders(String(today)),
    queryFn: () => fetchAdminDashboardOrders({ today, limit: 30 }),
    refetchInterval: 10_000,
    staleTime: 0,
  });
}

export function useAdminStoresDashboardQuery() {
  return useQuery({
    queryKey: adminDashboardKeys.stores(),
    queryFn: () => fetchAdminStoresDashboard({ limit: 10 }),
    refetchInterval: 120_000,
  });
}

export function useAdminRidersDashboardQuery() {
  return useQuery({
    queryKey: adminDashboardKeys.riders(),
    queryFn: fetchAdminRidersDashboard,
    refetchInterval: 15_000,
  });
}

export function useAdminUnassignedDashboardQuery() {
  return useQuery({
    queryKey: adminDashboardKeys.unassigned(),
    queryFn: fetchAdminUnassignedDashboard,
    refetchInterval: 10_000,
  });
}

export function useAdminPaymentsDashboardQuery() {
  return useQuery({
    queryKey: adminDashboardKeys.payments(),
    queryFn: fetchAdminPaymentsDashboard,
    refetchInterval: 120_000,
  });
}

export function useAdminCustomersDashboardQuery() {
  return useQuery({
    queryKey: adminDashboardKeys.customers(),
    queryFn: fetchAdminCustomersDashboard,
    refetchInterval: 300_000,
  });
}

export function useAdminCategoriesDashboardQuery() {
  return useQuery({
    queryKey: adminDashboardKeys.categories(),
    queryFn: fetchAdminCategoriesDashboard,
    refetchInterval: 300_000,
  });
}

export function useAdminFraudDashboardQuery() {
  return useQuery({
    queryKey: adminDashboardKeys.fraud(),
    queryFn: fetchAdminFraudDashboard,
    refetchInterval: 120_000,
  });
}

export function useAdminSystemHealthQuery() {
  return useQuery({
    queryKey: adminDashboardKeys.health(),
    queryFn: fetchAdminSystemHealth,
    refetchInterval: 30_000,
  });
}

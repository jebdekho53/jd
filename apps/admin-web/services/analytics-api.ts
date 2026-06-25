import { adminFetch, buildQuery } from '@/services/api/admin-client';
import type { ApiResponse } from '@/types/admin';

export interface ExecutiveAnalytics {
  asOf: string;
  source: string;
  gmv: number;
  orders: number;
  revenue: number;
  activeBuyers: number;
  activeMerchants: number;
  activeRiders: number;
  conversionRate: number;
  aov: number;
  refundRate: number;
  walletLiability: number;
  rewardLiability: number;
  growthPct: { gmv: number; orders: number; revenue: number };
  priorDay?: ExecutiveAnalytics | null;
}

export interface SalesAnalytics {
  granularity: string;
  source: string;
  series: { label: string; orders: number; gmv: number; revenue: number }[];
  comparisons: {
    current: { orders: number; gmv: number };
    previous: { orders: number; gmv: number };
    label: string;
  } | null;
}

export interface ControlRoomData {
  orders: { active: number; today: number; unassigned: number };
  riders: { online: number; busy: number; offline: number };
  deliveries: { inProgress: number; completedToday: number };
  revenue: { today: number; lastHour: number };
  storeActivity: { activeStores: number; preparingOrders: number };
  fraudAlerts: number;
  systemHealth: { api: string; db: string };
  alerts: { id: string; title: string; severity: string }[];
  updatedAt: string;
}

export async function fetchAnalyticsExecutive(): Promise<ExecutiveAnalytics> {
  const res = await adminFetch<ApiResponse<ExecutiveAnalytics>>('/api/admin/analytics/executive');
  return res.data;
}

export async function fetchAnalyticsSales(params: Record<string, string> = {}): Promise<SalesAnalytics> {
  const res = await adminFetch<ApiResponse<SalesAnalytics>>(
    `/api/admin/analytics/sales${buildQuery(params)}`,
  );
  return res.data;
}

export async function fetchAnalyticsSection<T>(section: string): Promise<T> {
  const res = await adminFetch<ApiResponse<T>>(`/api/admin/analytics/${section}`);
  return res.data;
}

export async function fetchControlRoom(): Promise<ControlRoomData> {
  const res = await adminFetch<ApiResponse<ControlRoomData>>('/api/admin/analytics/control-room');
  return res.data;
}

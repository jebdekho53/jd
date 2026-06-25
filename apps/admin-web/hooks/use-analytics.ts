import { useQuery } from '@tanstack/react-query';
import {
  fetchAnalyticsExecutive,
  fetchAnalyticsSales,
  fetchAnalyticsSection,
  fetchControlRoom,
} from '@/services/analytics-api';

export const analyticsKeys = {
  all: ['admin-analytics'] as const,
  executive: () => [...analyticsKeys.all, 'executive'] as const,
  sales: (g: string) => [...analyticsKeys.all, 'sales', g] as const,
  section: (s: string) => [...analyticsKeys.all, s] as const,
  controlRoom: () => [...analyticsKeys.all, 'control-room'] as const,
};

export function useAnalyticsExecutiveQuery() {
  return useQuery({
    queryKey: analyticsKeys.executive(),
    queryFn: fetchAnalyticsExecutive,
    refetchInterval: 60_000,
  });
}

export function useAnalyticsSalesQuery(granularity = 'daily') {
  return useQuery({
    queryKey: analyticsKeys.sales(granularity),
    queryFn: () => fetchAnalyticsSales({ granularity, compare: 'today_yesterday' }),
    refetchInterval: 120_000,
  });
}

export function useAnalyticsSectionQuery<T>(section: string) {
  return useQuery({
    queryKey: analyticsKeys.section(section),
    queryFn: () => fetchAnalyticsSection<T>(section),
    refetchInterval: 120_000,
  });
}

export function useControlRoomQuery() {
  return useQuery({
    queryKey: analyticsKeys.controlRoom(),
    queryFn: fetchControlRoom,
    refetchInterval: 15_000,
  });
}

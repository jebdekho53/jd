import { useQuery } from '@tanstack/react-query';
import {
  getEarningsHistory,
  getRiderEarnings,
  getTodayEarnings,
} from '@/services/rider-api';

export const EARNINGS_KEY = ['rider', 'earnings'] as const;
export const EARNINGS_TODAY_KEY = ['rider', 'earnings', 'today'] as const;
export const EARNINGS_HISTORY_KEY = ['rider', 'earnings', 'history'] as const;

export function useEarningsQuery() {
  return useQuery({ queryKey: EARNINGS_KEY, queryFn: getRiderEarnings });
}

export function useTodayEarningsQuery() {
  return useQuery({ queryKey: EARNINGS_TODAY_KEY, queryFn: getTodayEarnings });
}

export function useEarningsHistoryQuery() {
  return useQuery({ queryKey: EARNINGS_HISTORY_KEY, queryFn: getEarningsHistory });
}

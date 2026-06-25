import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationPreferences,
  updateNotificationPreference,
  getSettings,
  updateSettings,
  getReferralInfo,
  getRewardsInfo,
} from '@/features/profile/services/preferences-service';
import type { NotificationPreferences, ProfileSettings } from '@/features/profile/types';
import { getPaymentMethods } from '@/features/profile/services/payments-service';
import { getLoginSessions, logoutAllDevices } from '@/features/profile/services/security-service';
import { fetchReferrals, fetchRewards } from '@/services/wallet/wallet-api';

export const preferencesKeys = {
  notifications: ['profile', 'notifications'] as const,
  settings: ['profile', 'settings'] as const,
  referral: (userId: string) => ['profile', 'referral', userId] as const,
  rewards: ['profile', 'rewards'] as const,
  payments: ['profile', 'payments'] as const,
  sessions: ['profile', 'sessions'] as const,
};

export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: preferencesKeys.notifications,
    queryFn: getNotificationPreferences,
    staleTime: 60_000,
  });
}

export function useUpdateNotificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: keyof NotificationPreferences; value: boolean }) =>
      updateNotificationPreference(key, value),
    onSuccess: () => qc.invalidateQueries({ queryKey: preferencesKeys.notifications }),
  });
}

export function useSettingsQuery() {
  return useQuery({
    queryKey: preferencesKeys.settings,
    queryFn: getSettings,
    staleTime: 60_000,
  });
}

export function useUpdateSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ProfileSettings>) => updateSettings(patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: preferencesKeys.settings }),
  });
}

export function useReferralQuery(userId: string) {
  return useQuery({
    queryKey: preferencesKeys.referral(userId),
    queryFn: () => getReferralInfo(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}

export function useRewardsQuery() {
  return useQuery({
    queryKey: preferencesKeys.rewards,
    queryFn: getRewardsInfo,
    staleTime: 60_000,
  });
}

export function usePaymentMethodsQuery() {
  return useQuery({
    queryKey: preferencesKeys.payments,
    queryFn: getPaymentMethods,
    staleTime: 120_000,
  });
}

export function useLoginSessionsQuery() {
  return useQuery({
    queryKey: preferencesKeys.sessions,
    queryFn: getLoginSessions,
    staleTime: 30_000,
  });
}

export function useLogoutAllDevicesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logoutAllDevices,
    onSuccess: () => qc.invalidateQueries({ queryKey: preferencesKeys.sessions }),
  });
}

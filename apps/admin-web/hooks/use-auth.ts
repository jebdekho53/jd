'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeAdminPassword,
  fetchAdminSettings,
  fetchLoginStats,
  fetchMe,
  forgotPassword,
  listAdminSessions,
  loginWithPassword,
  logoutAllDevices,
  logoutSession,
  resetPassword,
  revokeAdminSession,
  updateAdminSettings,
} from '@/services/admin-api';
import { ApiError } from '@/services/api/admin-client';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;
export const ADMIN_SETTINGS_KEY = ['admin', 'settings'] as const;
export const ADMIN_SESSIONS_KEY = ['admin', 'sessions'] as const;
export const LOGIN_STATS_KEY = ['admin', 'login-stats'] as const;

export function useSessionQuery() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        return await fetchMe();
      } catch (err) {
        if (err instanceof ApiError && err.status === 0) throw err;
        return null;
      }
    },
    retry: (failureCount, error) =>
      error instanceof ApiError && error.status === 0 ? failureCount < 2 : false,
    staleTime: 60_000,
  });
}

export function useLoginStatsQuery() {
  return useQuery({
    queryKey: LOGIN_STATS_KEY,
    queryFn: fetchLoginStats,
    staleTime: 5 * 60_000,
  });
}

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: loginWithPassword,
    onSuccess: (data) => {
      qc.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: forgotPassword });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      resetPassword(token, newPassword),
  });
}

export function useLogoutMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logoutSession,
    onSettled: () => {
      qc.clear();
    },
  });
}

export function useAdminSettingsQuery() {
  return useQuery({
    queryKey: ADMIN_SETTINGS_KEY,
    queryFn: fetchAdminSettings,
  });
}

export function useUpdateAdminSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: (data) => {
      qc.setQueryData(ADMIN_SETTINGS_KEY, data);
    },
  });
}

export function useChangePasswordMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changeAdminPassword(currentPassword, newPassword),
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function useAdminSessionsQuery() {
  return useQuery({
    queryKey: ADMIN_SESSIONS_KEY,
    queryFn: listAdminSessions,
  });
}

export function useRevokeSessionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: revokeAdminSession,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_SESSIONS_KEY });
    },
  });
}

export function useLogoutAllMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logoutAllDevices,
    onSettled: () => {
      qc.clear();
    },
  });
}

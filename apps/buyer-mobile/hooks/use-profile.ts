import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSupportTicket,
  getInbox,
  getNotificationPreferences,
  getSupportCategories,
  getSupportTicket,
  listSupportTickets,
  logoutAllDevices,
  markAllNotificationsRead,
  markNotificationRead,
  replyToSupportTicket,
  searchSupportArticles,
  updateNotificationPreferences,
} from '@/services/buyer-api';
import { useAuthStore } from '@/store/auth-store';
import { useProfileStore } from '@/store/profile-store';
import type { CreateTicketPayload, NotificationPreferenceKey } from '@/types/profile';

export const profileKeys = {
  notificationPrefs: ['profile', 'notification-preferences'] as const,
  inbox: (page: number) => ['profile', 'inbox', page] as const,
  supportCategories: ['profile', 'support', 'categories'] as const,
  supportArticles: (q?: string) => ['profile', 'support', 'articles', q ?? ''] as const,
  supportTickets: ['profile', 'support', 'tickets'] as const,
  supportTicket: (id: string) => ['profile', 'support', 'ticket', id] as const,
};

/** Combines the authenticated user with the device-local display overrides,
 *  mirroring how buyer-web composes its profile. */
export function useProfile() {
  const user = useAuthStore((s) => s.user);
  const displayName = useProfileStore((s) => s.displayName);
  const localEmail = useProfileStore((s) => s.email);

  if (!user) return null;
  return {
    id: user.id,
    phone: user.phone,
    email: localEmail ?? user.email,
    displayName: displayName?.trim() || user.name || `Customer ${user.phone.slice(-4)}`,
    phoneVerified: user.phoneVerified,
    memberSince: user.createdAt,
  };
}

// ─── Notification preferences ────────────────────────────────────────────────

export function useNotificationPreferencesQuery() {
  return useQuery({
    queryKey: profileKeys.notificationPrefs,
    queryFn: getNotificationPreferences,
    staleTime: 60_000,
  });
}

export function useUpdateNotificationPreferenceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: NotificationPreferenceKey; value: boolean }) =>
      updateNotificationPreferences({ [key]: value }),
    onSuccess: (prefs) => qc.setQueryData(profileKeys.notificationPrefs, prefs),
  });
}

// ─── Inbox ───────────────────────────────────────────────────────────────────

export function useInboxQuery(page = 1) {
  return useQuery({
    queryKey: profileKeys.inbox(page),
    queryFn: () => getInbox(page),
    staleTime: 30_000,
  });
}

export function useMarkNotificationReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'inbox'] }),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', 'inbox'] }),
  });
}

// ─── Support ─────────────────────────────────────────────────────────────────

export function useSupportCategoriesQuery() {
  return useQuery({
    queryKey: profileKeys.supportCategories,
    queryFn: getSupportCategories,
    staleTime: 5 * 60_000,
  });
}

export function useSupportArticlesQuery(q?: string) {
  return useQuery({
    queryKey: profileKeys.supportArticles(q),
    queryFn: () => searchSupportArticles({ q }),
    staleTime: 60_000,
  });
}

export function useSupportTicketsQuery() {
  return useQuery({
    queryKey: profileKeys.supportTickets,
    queryFn: () => listSupportTickets({ limit: 20 }),
    staleTime: 30_000,
  });
}

export function useSupportTicketQuery(id: string) {
  return useQuery({
    queryKey: profileKeys.supportTicket(id),
    queryFn: () => getSupportTicket(id),
    enabled: !!id,
  });
}

export function useCreateSupportTicketMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => createSupportTicket(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.supportTickets }),
  });
}

export function useReplyToSupportTicketMutation(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => replyToSupportTicket(ticketId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.supportTicket(ticketId) }),
  });
}

// ─── Security ────────────────────────────────────────────────────────────────

export function useLogoutAllDevicesMutation() {
  return useMutation({ mutationFn: logoutAllDevices });
}

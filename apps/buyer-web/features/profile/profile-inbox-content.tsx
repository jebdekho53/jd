'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { ProfileShell } from '@/features/profile/components/profile-shell';
import { ProfileListSkeleton } from '@/features/profile/components/profile-skeleton';
import { ProfileErrorState } from '@/features/profile/components/profile-error';
import {
  fetchNotificationInbox,
  markAllNotificationsRead,
  markNotificationRead,
  type InboxNotification,
} from '@/services/crm/crm-api';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function ProfileInboxContent() {
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['crm', 'inbox'],
    queryFn: () => fetchNotificationInbox(1),
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'inbox'] }),
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm', 'inbox'] }),
  });

  if (isLoading) {
    return (
      <ProfileShell title="Notifications">
        <ProfileListSkeleton rows={6} />
      </ProfileShell>
    );
  }

  if (isError || !data) {
    return (
      <ProfileShell title="Notifications">
        <ProfileErrorState onRetry={() => refetch()} />
      </ProfileShell>
    );
  }

  const items = data.items ?? [];

  return (
    <ProfileShell title="Notifications">
      {data.unread > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-jd-text-muted">{data.unread} unread</p>
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden />
            Mark all read
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <Bell className="mb-3 h-8 w-8 text-jd-text-muted" aria-hidden />
          <p className="font-semibold text-jd-text-primary">You&rsquo;re all caught up</p>
          <p className="mt-1 text-sm text-jd-text-muted">
            Order updates, delivery alerts and replies will show up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((n: InboxNotification) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  if (!n.isRead) markRead.mutate(n.id);
                }}
                className={[
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition',
                  n.isRead
                    ? 'border-border bg-card'
                    : 'border-primary/30 bg-primary/5',
                ].join(' ')}
              >
                <span
                  className={[
                    'mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                    n.isRead ? 'bg-muted text-jd-text-muted' : 'bg-primary/10 text-primary',
                  ].join(' ')}
                >
                  <Bell className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-jd-text-primary">{n.title}</span>
                    {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                  </span>
                  <span className="mt-0.5 block line-clamp-2 text-sm text-jd-text-muted">{n.body}</span>
                  <span className="mt-1 block text-xs text-jd-text-muted">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ProfileShell>
  );
}

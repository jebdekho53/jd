'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listNotifications, markNotificationsRead } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';
import { QueryList } from '@/design-system/primitives';
import { PushToggle } from '@/features/pwa/push-toggle';
import { NotificationPreferencesPanel } from '@/features/rider/notification-preferences-panel';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const notifications = useQuery({ queryKey: ['rider', 'notifications'], queryFn: listNotifications });
  const markRead = useMutation({ mutationFn: (id?: string) => markNotificationsRead(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'notifications'] }) });
  return (
    <CaptainPageShell title="Notifications" subtitle="Delivery, payout, support, and system alerts.">
      <PushToggle />
      <NotificationPreferencesPanel />
      <Panel title="Inbox">
        <button onClick={() => markRead.mutate(undefined)} className="mb-3 text-xs font-bold text-rider-accent">Mark all read</button>
        <QueryList query={notifications} empty="No notifications yet." errorTitle="Could not load your notifications">
          {(items) => (
            <ul className="space-y-2">
              {items.map((n) => (
                <li key={n.id} className={`rounded-xl p-3 text-sm text-rider-text ${n.isRead ? 'bg-white/5' : 'border border-rider-accent/40 bg-rider-accent/10'}`}>
                  <div className="flex justify-between gap-3">
                    <b>{n.title}</b>
                    {!n.isRead && <button onClick={() => markRead.mutate(n.id)} className="text-xs font-bold text-rider-accent">Read</button>}
                  </div>
                  <p className="text-rider-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-rider-muted">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                </li>
              ))}
            </ul>
          )}
        </QueryList>
      </Panel>
    </CaptainPageShell>
  );
}

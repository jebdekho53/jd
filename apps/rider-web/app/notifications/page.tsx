'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listNotifications, markNotificationsRead } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const notifications = useQuery({ queryKey: ['rider', 'notifications'], queryFn: listNotifications });
  const markRead = useMutation({ mutationFn: (id?: string) => markNotificationsRead(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['rider', 'notifications'] }) });
  return (
    <CaptainPageShell title="Notifications" subtitle="Delivery, payout, support, and system alerts.">
      <Panel title="Inbox">
        <button onClick={() => markRead.mutate(undefined)} className="mb-3 text-xs font-semibold text-emerald-700">Mark all read</button>
        <ul className="space-y-2">
          {(notifications.data ?? []).map((n) => (
            <li key={n.id} className={`rounded-lg p-3 text-sm ${n.isRead ? 'bg-slate-100' : 'bg-emerald-50'}`}>
              <div className="flex justify-between gap-3">
                <b>{n.title}</b>
                {!n.isRead && <button onClick={() => markRead.mutate(n.id)} className="text-xs text-emerald-700">Read</button>}
              </div>
              <p className="text-slate-600">{n.body}</p>
              <p className="mt-1 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
            </li>
          ))}
          {notifications.data?.length === 0 && <li className="text-sm text-slate-500">No notifications yet.</li>}
        </ul>
      </Panel>
    </CaptainPageShell>
  );
}

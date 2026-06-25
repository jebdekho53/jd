'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

type Tab =
  | 'all'
  | 'open'
  | 'escalated'
  | 'high'
  | 'refund'
  | 'finance'
  | 'merchant'
  | 'rider';

const TABS: { id: Tab; label: string; path: string }[] = [
  { id: 'all', label: 'All Tickets', path: '/api/admin/support-center/tickets' },
  { id: 'open', label: 'Open', path: '/api/admin/support-center/tickets/open' },
  { id: 'escalated', label: 'Escalated', path: '/api/admin/support-center/tickets/escalated' },
  { id: 'high', label: 'High Priority', path: '/api/admin/support-center/tickets/high-priority' },
  { id: 'refund', label: 'Refund Related', path: '/api/admin/support-center/tickets/refund-related' },
  { id: 'finance', label: 'Finance Related', path: '/api/admin/support-center/tickets/finance-related' },
  { id: 'merchant', label: 'Merchant Related', path: '/api/admin/support-center/tickets/merchant-related' },
  { id: 'rider', label: 'Rider Related', path: '/api/admin/support-center/tickets/rider-related' },
];

export function SupportCenterContent() {
  const [tab, setTab] = useState<Tab>('all');
  const active = TABS.find((t) => t.id === tab)!;

  const { data: overview } = useQuery({
    queryKey: ['admin', 'support', 'overview'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: OverviewData }>(
        '/api/admin/support-center/overview',
      );
      return res.data;
    },
  });

  const { data: tickets } = useQuery({
    queryKey: ['admin', 'support', 'tickets', tab],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: TicketListData }>(active.path);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Created (30d)" value={String(overview?.ticketsCreated ?? 0)} />
        <Stat label="Resolved (30d)" value={String(overview?.ticketsResolved ?? 0)} />
        <Stat label="Open now" value={String(overview?.ticketsOpen ?? 0)} />
        <Stat label="Avg resolution (hrs)" value={String(overview?.averageResolutionHours ?? 0)} />
        <Stat label="SLA compliance" value={`${overview?.slaCompliancePct ?? 0}%`} />
        <Stat label="CSAT" value={overview?.csatScore != null ? `${overview.csatScore}%` : '—'} />
        <Stat label="Agent assignments" value={String(overview?.agentAssignments ?? 0)} />
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? 'bg-admin-700 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <section className="rounded-xl border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Team</th>
              </tr>
            </thead>
            <tbody>
              {(tickets?.items ?? []).map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{t.ticketNumber}</td>
                  <td className="px-4 py-3">{t.subject}</td>
                  <td className="px-4 py-3">{t.actorType}</td>
                  <td className="px-4 py-3">{t.priority}</td>
                  <td className="px-4 py-3">{t.status}</td>
                  <td className="px-4 py-3">{t.assignedTeam ?? '—'}</td>
                </tr>
              ))}
              {(tickets?.items ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No tickets in this view
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

interface OverviewData {
  ticketsCreated: number;
  ticketsResolved: number;
  ticketsOpen: number;
  averageResolutionHours: number;
  slaCompliancePct: number;
  csatScore: number | null;
  agentAssignments: number;
}

interface TicketListData {
  items: Array<{
    id: string;
    ticketNumber: string;
    subject: string;
    actorType: string;
    priority: string;
    status: string;
    assignedTeam: string | null;
  }>;
  total: number;
}

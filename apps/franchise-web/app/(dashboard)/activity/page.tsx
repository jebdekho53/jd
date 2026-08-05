'use client';

import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, MapPin, PauseCircle, Receipt, ShieldAlert, UserPlus, XCircle } from 'lucide-react';
import { EmptyState, PageHeader } from '@/components/ui';

type AuditAction =
  | 'ONBOARDED'
  | 'APPROVED'
  | 'SUSPENDED'
  | 'TERMINATED'
  | 'TERRITORY_ASSIGNED'
  | 'CONFLICT_DETECTED'
  | 'SETTLEMENT_CREATED'
  | 'CITY_LAUNCH_UPDATED';

interface AuditEntry {
  id: string;
  action: AuditAction;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const ACTION_META: Record<AuditAction, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  ONBOARDED: { label: 'Onboarded as a franchise partner', icon: UserPlus, tone: 'text-emerald-400' },
  APPROVED: { label: 'Application approved', icon: CheckCircle2, tone: 'text-emerald-400' },
  SUSPENDED: { label: 'Account suspended', icon: PauseCircle, tone: 'text-amber-400' },
  TERMINATED: { label: 'Partnership terminated', icon: XCircle, tone: 'text-red-400' },
  TERRITORY_ASSIGNED: { label: 'Territory assigned', icon: MapPin, tone: 'text-slate-300' },
  CONFLICT_DETECTED: { label: 'Territory conflict', icon: AlertTriangle, tone: 'text-amber-400' },
  SETTLEMENT_CREATED: { label: 'Settlement generated', icon: Receipt, tone: 'text-slate-300' },
  CITY_LAUNCH_UPDATED: { label: 'City launch plan updated', icon: ShieldAlert, tone: 'text-slate-300' },
};

function describe(entry: AuditEntry): string | null {
  const m = entry.metadata;
  if (!m) return null;
  if (entry.action === 'TERRITORY_ASSIGNED' && typeof m.conflicts === 'number') {
    return m.conflicts > 0 ? `${m.conflicts} conflict(s) detected on assignment` : null;
  }
  if (entry.action === 'CONFLICT_DETECTED' && m.resolved) {
    return `Resolved: ${m.decision ?? m.reason ?? m.resolution ?? ''}`.trim();
  }
  return null;
}

function ActivityInner() {
  const { data, isLoading } = useQuery({
    queryKey: ['franchise', 'activity'],
    queryFn: async (): Promise<AuditEntry[]> => {
      const res = await fetch('/api/franchise/activity');
      const json = await res.json();
      return json.data ?? [];
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;

  const entries = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" subtitle="A read-only history of what has happened on your account and why." />

      {entries.length === 0 ? (
        <EmptyState message="Nothing recorded yet." />
      ) : (
        <div className="relative space-y-4 border-l border-slate-800 pl-6">
          {entries.map((entry) => {
            const meta = ACTION_META[entry.action] ?? { label: entry.action, icon: CheckCircle2, tone: 'text-slate-300' };
            const Icon = meta.icon;
            const detail = describe(entry);
            return (
              <div key={entry.id} className="relative">
                <span className={`absolute -left-[29px] flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 ${meta.tone}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm font-medium text-white">{meta.label}</p>
                {detail && <p className="mt-0.5 text-xs text-slate-400">{detail}</p>}
                <p className="mt-0.5 text-xs text-slate-600">{new Date(entry.createdAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <ActivityInner />
    </QueryClientProvider>
  );
}

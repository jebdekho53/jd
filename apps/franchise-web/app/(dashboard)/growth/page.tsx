'use client';

import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { EmptyState, PageHeader, Panel, Pill, Stat } from '@/components/ui';

interface Standing {
  rank: number | null;
  totalPartners: number;
  earned: number;
  activeStores: number;
  top: Array<{ rank: number; franchiseId: string; businessName: string; city: string | null; earned: number }>;
}

interface Application {
  id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'KYC_PENDING' | 'APPROVED' | 'REJECTED';
  businessName?: string | null;
  storeName?: string | null;
  ownerName?: string | null;
  city?: string | null;
  pincode?: string | null;
  submittedAt?: string | null;
}

interface Pipeline {
  total: number;
  counts: Record<string, number>;
  applications: Application[];
}

interface GrowthResponse {
  standing: Standing;
  pipeline: Pipeline;
}

const FUNNEL_STEPS: Array<{ key: string; label: string }> = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under review' },
  { key: 'KYC_PENDING', label: 'KYC pending' },
  { key: 'APPROVED', label: 'Approved' },
];

function GrowthInner() {
  const { data, isLoading } = useQuery({
    queryKey: ['franchise', 'growth'],
    queryFn: async (): Promise<GrowthResponse> => {
      const res = await fetch('/api/franchise/growth');
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;

  const standing = data?.standing;
  const pipeline = data?.pipeline;
  const approved = pipeline?.counts?.APPROVED ?? 0;
  const rejected = pipeline?.counts?.REJECTED ?? 0;
  const decided = approved + rejected;
  const conversionRate = decided > 0 ? Math.round((approved / decided) * 100) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Growth"
        subtitle="Your standing among all partners, and how your merchant recruitment is converting."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat
          label="Your rank"
          value={standing?.rank ? `#${standing.rank}` : '—'}
          sub={standing ? `of ${standing.totalPartners} active partners` : undefined}
          tone="emerald"
        />
        <Stat label="Commission earned" value={`₹${(standing?.earned ?? 0).toLocaleString()}`} />
        <Stat label="Active stores" value={String(standing?.activeStores ?? 0)} />
        <Stat
          label="Recruitment conversion"
          value={conversionRate !== null ? `${conversionRate}%` : '—'}
          sub={decided > 0 ? `${approved} approved of ${decided} decided` : 'No decisions yet'}
        />
      </div>

      <Panel title="Merchant recruitment funnel">
        {pipeline && pipeline.total > 0 ? (
          <div className="space-y-3">
            {FUNNEL_STEPS.map((step) => {
              const count = pipeline.counts[step.key] ?? 0;
              const pct = Math.round((count / Math.max(1, pipeline.total)) * 100);
              return (
                <div key={step.key}>
                  <div className="mb-1 flex justify-between text-xs text-slate-400">
                    <span>{step.label}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {rejected > 0 && (
              <p className="pt-1 text-xs text-slate-500">
                {rejected} application{rejected !== 1 ? 's' : ''} rejected.
              </p>
            )}
          </div>
        ) : (
          <EmptyState message="Share your referral link from the Dashboard to start recruiting merchants." />
        )}
      </Panel>

      <Panel title="Leaderboard — top partners by commission earned">
        {standing && standing.top.length > 0 ? (
          <div className="space-y-1.5">
            {standing.top.map((row) => (
              <div
                key={row.franchiseId}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                  row.rank === standing.rank ? 'bg-emerald-500/10 text-emerald-200' : 'bg-slate-950 text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  {row.rank === 1 ? (
                    <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <span className="w-3.5 text-center text-xs text-slate-500">{row.rank}</span>
                  )}
                  {row.businessName}
                  {row.city && <span className="text-xs text-slate-500">· {row.city}</span>}
                </span>
                <span className="font-medium">₹{row.earned.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Leaderboard not available yet." />
        )}
      </Panel>

      <Panel title="Recent applications">
        <div className="space-y-2">
          {(pipeline?.applications ?? []).slice(0, 10).map((app) => (
            <div key={app.id} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 p-3 text-sm">
              <div>
                <p className="font-medium text-white">{app.businessName ?? app.storeName ?? app.ownerName}</p>
                <p className="text-xs text-slate-500">
                  {app.city ?? '—'} · {app.pincode ?? '—'}
                  {app.submittedAt && ` · ${new Date(app.submittedAt).toLocaleDateString()}`}
                </p>
              </div>
              <StatusPill status={app.status} />
            </div>
          ))}
          {(pipeline?.applications ?? []).length === 0 && <EmptyState message="No recruited merchants yet." />}
        </div>
      </Panel>
    </div>
  );
}

function StatusPill({ status }: { status: Application['status'] }) {
  if (status === 'APPROVED') return <Pill tone="emerald">Approved</Pill>;
  if (status === 'REJECTED') return <Pill tone="red">Rejected</Pill>;
  if (status === 'KYC_PENDING') return <Pill tone="amber">KYC pending</Pill>;
  if (status === 'UNDER_REVIEW') return <Pill tone="violet">Under review</Pill>;
  return <Pill tone="slate">{status}</Pill>;
}

export default function GrowthPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <GrowthInner />
    </QueryClientProvider>
  );
}

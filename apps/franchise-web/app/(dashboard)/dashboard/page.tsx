'use client';

import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Copy, Trophy } from 'lucide-react';
import { EmptyState, PageHeader, Panel, Pill, Stat } from '@/components/ui';

async function fetchFranchise<T>(path: string): Promise<T> {
  const res = await fetch(`/api/franchise/${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

function DashboardInner() {
  const dashboard = useQuery({ queryKey: ['franchise', 'dashboard'], queryFn: () => fetchFranchise<Dashboard>('dashboard') });
  const referral = useQuery({ queryKey: ['franchise', 'referral'], queryFn: () => fetchFranchise<Referral>('referral') });
  const pipeline = useQuery({ queryKey: ['franchise', 'pipeline'], queryFn: () => fetchFranchise<Pipeline>('pipeline') });
  const stores = useQuery({ queryKey: ['franchise', 'stores'], queryFn: () => fetchFranchise<StoresResponse>('stores') });
  const finance = useQuery({ queryKey: ['franchise', 'finance'], queryFn: () => fetchFranchise<Settlement[]>('finance') });
  const leaderboard = useQuery({ queryKey: ['franchise', 'leaderboard'], queryFn: () => fetchFranchise<Standing>('leaderboard') });

  const data = dashboard.data;
  const standing = leaderboard.data;
  const settlements = finance.data ?? [];
  const paid = settlements
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + Number(s.franchiseShare), 0);
  const pending = settlements
    .filter((s) => s.status !== 'PAID')
    .reduce((sum, s) => sum + Number(s.franchiseShare), 0);

  if (dashboard.isLoading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={data?.businessName ?? 'Franchise Dashboard'} subtitle={data?.status ? `Status: ${data.status}` : undefined} />
        {standing?.rank && (
          <Pill tone="emerald">
            <span className="inline-flex items-center gap-1">
              <Trophy className="h-3 w-3" /> Rank #{standing.rank} of {standing.totalPartners}
            </span>
          </Pill>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="GMV (30d)" value={`₹${(data?.gmv30d ?? 0).toLocaleString()}`} />
        <Stat label="Orders (30d)" value={String(data?.orders30d ?? 0)} />
        <Stat label="Pending Earnings" value={`₹${pending.toLocaleString()}`} tone="amber" />
        <Stat label="Paid" value={`₹${paid.toLocaleString()}`} tone="emerald" />
      </div>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Referral Link</h2>
        {referral.data ? (
          <div className="flex flex-wrap items-center gap-3">
            <code className="rounded-md bg-slate-950 px-3 py-2 text-sm text-emerald-300">{referral.data.inviteUrl}</code>
            <button
              onClick={() => navigator.clipboard.writeText(referral.data!.inviteUrl)}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
            <span className="text-xs text-slate-400">{referral.data.referralCode}</span>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading referral link...</p>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Merchant Pipeline">
          <div className="mb-3 flex flex-wrap gap-2">
            {Object.entries(pipeline.data?.counts ?? {}).map(([status, count]) => (
              <span key={status} className="rounded-md bg-slate-950 px-2 py-1 text-xs text-slate-300">{status}: {count}</span>
            ))}
          </div>
          <div className="space-y-2">
            {(pipeline.data?.applications ?? []).slice(0, 8).map((app) => (
              <div key={app.id} className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white">{app.businessName ?? app.storeName ?? app.ownerName}</span>
                  <span className="text-xs text-slate-400">{app.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{app.city ?? '-'} · {app.pincode ?? '-'}</p>
              </div>
            ))}
            {(pipeline.data?.applications ?? []).length === 0 && <EmptyState message="No recruited merchants yet." />}
          </div>
        </Panel>

        <Panel title="Linked Stores">
          <StoreGroup label="Active" links={stores.data?.links.active ?? []} />
          <StoreGroup label="Pending Review" links={stores.data?.links.pendingReview ?? []} />
          <StoreGroup label="Rejected" links={stores.data?.links.rejected ?? []} />
        </Panel>
      </section>

      <Panel title="Earnings">
        <div className="space-y-2">
          {settlements.slice(0, 8).map((s) => (
            <div key={s.id} className="grid gap-2 rounded-md border border-slate-800 bg-slate-950 p-3 text-sm sm:grid-cols-5">
              <span className="text-slate-300">{new Date(s.periodEnd).toLocaleDateString()}</span>
              <span className="text-slate-400">GMV ₹{Number(s.grossGmv).toLocaleString()}</span>
              <span className="text-slate-400">Base ₹{Number(s.commissionBase).toLocaleString()}</span>
              <span className="font-semibold text-white">₹{Number(s.franchiseShare).toLocaleString()}</span>
              <span className="text-xs text-slate-400">{s.status}</span>
            </div>
          ))}
          {settlements.length === 0 && <EmptyState message="No settlements yet." />}
        </div>
      </Panel>
    </div>
  );
}

function StoreGroup({ label, links }: { label: string; links: FranchiseStoreLink[] }) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">{label}</h3>
      <div className="space-y-2">
        {links.map((link) => (
          <div key={link.id} className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium text-white">{link.store.name}</span>
              <span className="text-xs text-slate-400">{link.store.pincode}</span>
            </div>
            {link.conflictReason && <p className="mt-2 text-xs text-amber-300">{link.conflictReason}</p>}
          </div>
        ))}
        {links.length === 0 && <p className="text-sm text-slate-600">None.</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <DashboardInner />
    </QueryClientProvider>
  );
}

interface Dashboard {
  businessName?: string;
  status?: string;
  gmv30d?: number;
  orders30d?: number;
}
interface Standing {
  rank: number | null;
  totalPartners: number;
}
interface Referral {
  referralCode: string;
  inviteUrl: string;
}
interface Pipeline {
  total: number;
  counts: Record<string, number>;
  applications: Array<{
    id: string;
    status: string;
    businessName?: string | null;
    storeName?: string | null;
    ownerName?: string | null;
    city?: string | null;
    pincode?: string | null;
  }>;
}
interface StoresResponse {
  links: {
    active: FranchiseStoreLink[];
    pendingReview: FranchiseStoreLink[];
    rejected: FranchiseStoreLink[];
  };
}
interface FranchiseStoreLink {
  id: string;
  conflictReason?: string | null;
  store: { id: string; name: string; pincode?: string | null };
}
interface Settlement {
  id: string;
  periodEnd: string;
  grossGmv: number | string;
  commissionBase: number | string;
  franchiseShare: number | string;
  status: string;
}

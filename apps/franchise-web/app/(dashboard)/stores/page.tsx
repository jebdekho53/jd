'use client';

import { useMemo, useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, PauseCircle, Search, XCircle } from 'lucide-react';
import { EmptyState, PageHeader, Pill, Stat } from '@/components/ui';

interface FranchiseStoreLink {
  id: string;
  conflictReason?: string | null;
  linkedAt: string;
  status: 'ACTIVE' | 'PENDING_REVIEW' | 'REJECTED';
  store: {
    id: string;
    name: string;
    slug: string;
    pincode?: string | null;
    status: string;
    isActive: boolean;
  };
}

interface StoresResponse {
  storeCount: number;
  gmv30d: number;
  orders30d: number;
  links: {
    active: FranchiseStoreLink[];
    pendingReview: FranchiseStoreLink[];
    rejected: FranchiseStoreLink[];
  };
}

type Tab = 'active' | 'pendingReview' | 'rejected';

function StoresInner() {
  const { data, isLoading } = useQuery({
    queryKey: ['franchise', 'stores'],
    queryFn: async (): Promise<StoresResponse> => {
      const res = await fetch('/api/franchise/stores');
      const json = await res.json();
      return json.data;
    },
  });

  const [tab, setTab] = useState<Tab>('active');
  const [query, setQuery] = useState('');

  const groups = data?.links ?? { active: [], pendingReview: [], rejected: [] };
  const counts = {
    active: groups.active.length,
    pendingReview: groups.pendingReview.length,
    rejected: groups.rejected.length,
  };
  const liveCount = groups.active.filter((l) => l.store.isActive).length;

  const filtered = useMemo(() => {
    const list = groups[tab];
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter(
      (l) => l.store.name.toLowerCase().includes(q) || (l.store.pincode ?? '').includes(q),
    );
  }, [groups, tab, query]);

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Your Stores" subtitle="Every store attributed to your franchise, and its current standing." />

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Linked stores" value={String(data?.storeCount ?? 0)} />
        <Stat label="Live right now" value={String(liveCount)} sub={`of ${counts.active} active links`} tone="emerald" />
        <Stat label="GMV (30d)" value={`₹${(data?.gmv30d ?? 0).toLocaleString()}`} />
        <Stat label="Orders (30d)" value={String(data?.orders30d ?? 0)} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <TabButton label="Active" count={counts.active} active={tab === 'active'} onClick={() => setTab('active')} />
          <TabButton
            label="Pending Review"
            count={counts.pendingReview}
            active={tab === 'pendingReview'}
            onClick={() => setTab('pendingReview')}
          />
          <TabButton label="Rejected" count={counts.rejected} active={tab === 'rejected'} onClick={() => setTab('rejected')} />
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or pincode"
            className="w-56 rounded-md border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((link) => (
          <StoreCard key={link.id} link={link} />
        ))}
        {filtered.length === 0 && (
          <div className="sm:col-span-2 xl:col-span-3">
            <EmptyState message={query ? 'No stores match your search.' : 'Nothing here yet.'} />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
      }`}
    >
      {label} <span className={active ? 'text-slate-800' : 'text-slate-500'}>({count})</span>
    </button>
  );
}

function StoreCard({ link }: { link: FranchiseStoreLink }) {
  const { store } = link;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={`https://jebdekho.com/store/${store.slug}`}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-1.5 truncate font-medium text-white hover:text-emerald-300"
          >
            <span className="truncate">{store.name}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100" />
          </a>
          <p className="mt-0.5 text-xs text-slate-500">{store.pincode ?? 'No pincode on file'}</p>
        </div>
        <LiveBadge isActive={store.isActive} storeStatus={store.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill tone={link.status === 'ACTIVE' ? 'emerald' : link.status === 'REJECTED' ? 'red' : 'amber'}>
          {link.status === 'PENDING_REVIEW' ? 'Pending Review' : link.status}
        </Pill>
        <Pill tone="slate">{store.status.replaceAll('_', ' ')}</Pill>
      </div>

      {link.conflictReason && (
        <p className="mt-3 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-300">{link.conflictReason}</p>
      )}

      <p className="mt-3 text-xs text-slate-600">Linked {new Date(link.linkedAt).toLocaleDateString()}</p>
    </div>
  );
}

function LiveBadge({ isActive, storeStatus }: { isActive: boolean; storeStatus: string }) {
  if (storeStatus !== 'APPROVED') {
    return <PauseCircle className="h-4 w-4 shrink-0 text-slate-600" aria-label="Not yet approved" />;
  }
  return isActive ? (
    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Live" />
  ) : (
    <XCircle className="h-4 w-4 shrink-0 text-slate-600" aria-label="Offline" />
  );
}

export default function StoresPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <StoresInner />
    </QueryClientProvider>
  );
}

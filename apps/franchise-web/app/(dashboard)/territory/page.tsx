'use client';

import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertTriangle, Copy, MapPin, ShieldCheck } from 'lucide-react';
import { EmptyState, PageHeader, Panel, Pill, Stat } from '@/components/ui';

interface Territory {
  id: string;
  city: string;
  state: string;
  pincodes: string[];
  exclusivityEnabled: boolean;
  launchDate: string | null;
}

interface TerritoryResponse {
  territories: Territory[];
  pincodes: string[];
}

interface Conflict {
  id: string;
  pincode: string;
  status: 'OPEN' | 'RESOLVED';
  resolution: string | null;
  createdAt: string;
  franchise: { businessName: string };
  conflictingTerritory: { franchise: { businessName: string } };
}

function TerritoryInner() {
  const { data, isLoading } = useQuery({
    queryKey: ['franchise', 'territory'],
    queryFn: async (): Promise<TerritoryResponse> => {
      const res = await fetch('/api/franchise/territory');
      const json = await res.json();
      return json.data;
    },
  });

  const conflicts = useQuery({
    queryKey: ['franchise', 'territory-conflicts'],
    queryFn: async (): Promise<Conflict[]> => {
      const res = await fetch('/api/franchise/territory-conflicts');
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const territories = data?.territories ?? [];
  const openConflicts = (conflicts.data ?? []).filter((c) => c.status === 'OPEN');

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Territory Coverage" subtitle="The cities and pincodes assigned to your franchise." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Territories" value={String(territories.length)} />
        <Stat label="Pincodes covered" value={String(data?.pincodes.length ?? 0)} />
        <Stat
          label="Open conflicts"
          value={String(openConflicts.length)}
          tone={openConflicts.length > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {territories.length === 0 ? (
        <EmptyState message="No territory has been assigned to your franchise yet — reach out to your onboarding contact." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {territories.map((t) => (
            <TerritoryCard key={t.id} territory={t} />
          ))}
        </div>
      )}

      <Panel title="Territory conflicts">
        {(conflicts.data ?? []).length === 0 ? (
          <EmptyState message="No overlapping-territory disputes on record." />
        ) : (
          <div className="space-y-2">
            {(conflicts.data ?? []).map((c) => (
              <div key={c.id} className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 font-medium text-white">
                    {c.status === 'OPEN' && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                    Pincode {c.pincode}
                  </span>
                  <Pill tone={c.status === 'OPEN' ? 'amber' : 'emerald'}>{c.status}</Pill>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  {c.franchise.businessName} vs {c.conflictingTerritory.franchise.businessName}
                </p>
                {c.resolution && <p className="mt-2 text-xs text-emerald-300">Resolution: {c.resolution}</p>}
                <p className="mt-2 text-xs text-slate-600">{new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function TerritoryCard({ territory }: { territory: Territory }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? territory.pincodes : territory.pincodes.slice(0, 8);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-500" />
          <div>
            <p className="font-medium text-white">{territory.city}</p>
            <p className="text-xs text-slate-500">{territory.state}</p>
          </div>
        </div>
        {territory.exclusivityEnabled && (
          <Pill tone="emerald">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Exclusive
            </span>
          </Pill>
        )}
      </div>

      {territory.launchDate && (
        <p className="mt-2 text-xs text-slate-500">Launched {new Date(territory.launchDate).toLocaleDateString()}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-slate-500">{territory.pincodes.length} pincodes</p>
        <button
          onClick={() => navigator.clipboard.writeText(territory.pincodes.join(', '))}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-300"
        >
          <Copy className="h-3 w-3" /> Copy all
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {visible.map((p) => (
          <span key={p} className="rounded bg-slate-950 px-2 py-0.5 text-xs text-slate-300">
            {p}
          </span>
        ))}
        {territory.pincodes.length > 8 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded bg-slate-950 px-2 py-0.5 text-xs text-emerald-300 hover:text-emerald-200"
          >
            {expanded ? 'Show less' : `+${territory.pincodes.length - 8} more`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function TerritoryPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <TerritoryInner />
    </QueryClientProvider>
  );
}

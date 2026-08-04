'use client';

import { useState } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Copy, MapPin, ShieldCheck } from 'lucide-react';
import { EmptyState, PageHeader, Pill, Stat } from '@/components/ui';

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

function TerritoryInner() {
  const { data, isLoading } = useQuery({
    queryKey: ['franchise', 'territory'],
    queryFn: async (): Promise<TerritoryResponse> => {
      const res = await fetch('/api/franchise/territory');
      const json = await res.json();
      return json.data;
    },
  });

  const territories = data?.territories ?? [];
  const exclusiveCount = territories.filter((t) => t.exclusivityEnabled).length;

  if (isLoading) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Territory Coverage" subtitle="The cities and pincodes assigned to your franchise." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Territories" value={String(territories.length)} />
        <Stat label="Pincodes covered" value={String(data?.pincodes.length ?? 0)} />
        <Stat label="Exclusive territories" value={String(exclusiveCount)} tone="emerald" />
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

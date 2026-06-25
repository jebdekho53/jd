'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';

async function fetchAI(path: string) {
  const res = await fetch(`/api/admin/ai-commerce/${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function AdminAICommerceContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ai-commerce'],
    queryFn: () => fetchAI('overview'),
  });

  return (
    <DashboardShell title="AI Commerce Control Center">
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Forecast accuracy" value={`${data.accuracy?.accuracyPct ?? 0}%`} />
            <Stat label="Inventory crises" value={String(data.crises?.length ?? 0)} />
            <Stat label="Hotspots" value={String(data.hotspots?.length ?? 0)} />
          </div>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 font-semibold">Trending categories</h2>
            {(data.trending ?? []).map((t: { category: string; demandScore: number; city: string }) => (
              <div key={`${t.category}-${t.city}`} className="flex justify-between text-sm">
                <span>{t.category} · {t.city}</span>
                <span>{Math.round(t.demandScore)}</span>
              </div>
            ))}
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 font-semibold">AI Recommendations</h2>
            {(data.recommendations ?? []).slice(0, 10).map((r: { id: string; title: string; priority: string }) => (
              <div key={r.id} className="text-sm">
                <span className="font-medium">{r.title}</span>
                <span className="ml-2 text-xs text-slate-500">{r.priority}</span>
              </div>
            ))}
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 font-semibold">National demand map (hotspots)</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {(data.hotspots ?? []).slice(0, 12).map((h: { id: string; city: string; locality: string; demandScore: number }) => (
                <div key={h.id} className="rounded-lg bg-orange-50 px-3 py-2 text-sm">
                  {h.locality}, {h.city} — {Math.round(h.demandScore)}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

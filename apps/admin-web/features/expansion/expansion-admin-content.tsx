'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchExpansion(path: string) {
  const res = await fetch(path.startsWith('/api') ? path : `/api/admin/expansion/${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

type Tab = 'cities' | 'franchises' | 'territories' | 'conflicts' | 'revenue';

export function ExpansionAdminContent() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin', 'expansion'],
    queryFn: () => fetchExpansion('/api/admin/expansion'),
  });

  if (isLoading) return <p className="text-sm text-slate-400">Loading expansion tower…</p>;

  const cities = overview?.cities ?? [];
  const franchises = overview?.franchises ?? [];
  const conflicts = overview?.conflicts ?? [];
  const revenue = overview?.revenue ?? [];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Widget label="Active Franchises" value={String(overview?.active ?? 0)} />
        <Widget label="Pending" value={String(overview?.pending ?? 0)} />
        <Widget label="Suspended" value={String(overview?.suspended ?? 0)} />
        <Widget label="Open Conflicts" value={String(overview?.openConflicts ?? 0)} />
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Cities — Launch Status</h2>
        <div className="space-y-1">
          {cities.map((c: CityRow) => (
            <div key={c.id} className="flex justify-between text-xs text-slate-300">
              <span>{c.city}, {c.state}</span>
              <span>{c.launchStatus} · Score {Math.round(c.readinessScore)}</span>
            </div>
          ))}
          {cities.length === 0 && <p className="text-xs text-slate-500">No city launch plans yet.</p>}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Franchise Partners">
          {franchises.map((f: FranchiseRow) => (
            <div key={f.id} className="flex justify-between text-xs text-slate-300">
              <span>{f.businessName}</span>
              <span>{f.status} · {f.commissionPercent}%</span>
            </div>
          ))}
          {franchises.length === 0 && (
            <p className="text-xs text-slate-500">No franchise partners yet.</p>
          )}
        </Panel>
        <Panel title="Territory Conflicts">
          {conflicts.map((c: ConflictRow) => (
            <div key={c.id} className="text-xs text-amber-300">
              Pincode {c.pincode} · {c.franchise?.businessName}
            </div>
          ))}
          {conflicts.length === 0 && <p className="text-xs text-slate-500">No open conflicts.</p>}
        </Panel>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Franchise Revenue</h2>
        {revenue.slice(0, 8).map((r: RevenueRow) => (
          <div key={r.id} className="flex justify-between text-xs text-slate-300">
            <span>{r.franchise?.businessName}</span>
            <span>₹{Number(r.franchiseShare)} · {r.status}</span>
          </div>
        ))}
      </section>
    </div>
  );
}

function Widget({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">{title}</h2>
      {children}
    </div>
  );
}

interface FranchiseRow { id: string; businessName: string; status: string; commissionPercent: number }
interface CityRow { id: string; city: string; state: string; launchStatus: string; readinessScore: number }
interface ConflictRow { id: string; pincode: string; franchise?: { businessName: string } }
interface RevenueRow { id: string; franchiseShare: number; status: string; franchise?: { businessName: string } }

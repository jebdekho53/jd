'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardShell } from '@/components/layout/dashboard-shell';

interface AdsOverview {
  metrics?: {
    revenue: number;
    adSpend: number;
    roas: number;
    ctr: number;
    advertisers: number;
    impressions: number;
    clicks: number;
  };
  placements?: { placement: string; impressions: number; spend: number }[];
  timeseries?: { date: string; impressions: number; clicks: number; ctr: number }[];
  campaignBreakdown?: CampaignRow[];
  campaigns?: { id: string; name: string; advertiser: { businessName: string } }[];
}

interface CampaignRow {
  id: string;
  name: string;
  advertiser: string;
  status: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  revenue: number;
  spend: number;
  roas: number;
}

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const num = (n: number) => n.toLocaleString('en-IN');

export function AdminAdsContent() {
  const { data, isLoading } = useQuery<AdsOverview>({
    queryKey: ['admin', 'ads'],
    queryFn: async () => {
      const res = await fetch('/api/admin/ads/overview');
      const json = await res.json();
      return json.data;
    },
  });

  const m = data?.metrics;
  const rows = data?.campaignBreakdown ?? [];

  return (
    <DashboardShell title="Ads Control Center">
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {data && (
        <div className="space-y-6">
          {/* Headline metrics */}
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Ad revenue" value={inr(m?.revenue ?? 0)} />
            <Stat label="Ad spend" value={inr(m?.adSpend ?? 0)} />
            <Stat label="ROAS" value={`${m?.roas ?? 0}×`} accent />
            <Stat label="CTR" value={`${m?.ctr ?? 0}%`} />
            <Stat label="Impressions" value={num(m?.impressions ?? 0)} />
            <Stat label="Clicks" value={num(m?.clicks ?? 0)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Trend */}
            <section className="rounded-xl border bg-white p-4 lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">
                Impressions vs clicks (14d)
              </h2>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.timeseries ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(d: string) => d.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="impressions" stroke="#0284c7" dot={false} />
                    <Line type="monotone" dataKey="clicks" stroke="#f59e0b" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Placement reach */}
            <section className="rounded-xl border bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">Reach by placement</h2>
              {(data.placements ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No impressions yet.</p>
              ) : (
                <PlacementBars placements={data.placements ?? []} />
              )}
            </section>
          </div>

          {/* Per-campaign table */}
          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Campaign performance</h2>
            {rows.length === 0 ? (
              <p className="text-sm text-slate-500">No campaigns yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-slate-400">
                      <th className="py-2 pr-3">Campaign</th>
                      <th className="py-2 pr-3">Advertiser</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3 text-right">Impr.</th>
                      <th className="py-2 pr-3 text-right">Clicks</th>
                      <th className="py-2 pr-3 text-right">CTR</th>
                      <th className="py-2 pr-3 text-right">Conv.</th>
                      <th className="py-2 pr-3 text-right">Spend</th>
                      <th className="py-2 pr-3 text-right">Revenue</th>
                      <th className="py-2 text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr key={c.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium text-slate-800">{c.name}</td>
                        <td className="py-2 pr-3 text-slate-600">{c.advertiser}</td>
                        <td className="py-2 pr-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                              c.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums">{num(c.impressions)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{num(c.clicks)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{c.ctr}%</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{num(c.conversions)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{inr(c.spend)}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{inr(c.revenue)}</td>
                        <td className="py-2 text-right tabular-nums font-semibold">{c.roas}×</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function PlacementBars({ placements }: { placements: { placement: string; impressions: number; spend: number }[] }) {
  const max = Math.max(1, ...placements.map((p) => p.impressions));
  return (
    <ul className="space-y-3">
      {placements.map((p) => (
        <li key={p.placement}>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-medium text-slate-700">{p.placement}</span>
            <span>
              {num(p.impressions)} impr · {inr(p.spend)}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-admin-500" style={{ width: `${(p.impressions / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-admin-100 bg-admin-50' : 'bg-white'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

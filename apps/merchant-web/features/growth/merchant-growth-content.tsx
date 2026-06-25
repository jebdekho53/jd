'use client';

import { useQuery } from '@tanstack/react-query';
import { useStoreStore } from '@/store/store-store';
import Link from 'next/link';

async function fetchGrowth(path: string, storeId?: string) {
  const params = storeId ? `?storeId=${storeId}` : '';
  const res = await fetch(`/api/merchant/growth/${path}${params}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function MerchantGrowthContent() {
  const { currentStore } = useStoreStore();
  const storeId = currentStore?.id;

  const { data: overview, isLoading } = useQuery({
    queryKey: ['merchant', 'growth', 'overview', storeId],
    queryFn: () => fetchGrowth('overview', storeId),
    enabled: !!storeId,
  });

  const { data: recommendations } = useQuery({
    queryKey: ['merchant', 'growth', 'recommendations', storeId],
    queryFn: () => fetchGrowth('recommendations', storeId),
    enabled: !!storeId,
  });

  const { data: visibility } = useQuery({
    queryKey: ['merchant', 'growth', 'visibility', storeId],
    queryFn: () => fetchGrowth('visibility', storeId),
    enabled: !!storeId,
  });

  const { data: benchmark } = useQuery({
    queryKey: ['merchant', 'growth', 'benchmark', storeId],
    queryFn: () => fetchGrowth('benchmark', storeId),
    enabled: !!storeId,
  });

  const { data: expansionOpps } = useQuery({
    queryKey: ['merchant', 'growth', 'expansion', storeId],
    queryFn: () => fetchGrowth('expansion', storeId),
    enabled: !!storeId,
  });

  if (!storeId) {
    return <p className="text-sm text-slate-500">Select a store to view growth insights.</p>;
  }

  if (isLoading) return <p className="text-sm text-slate-500">Loading growth dashboard…</p>;

  const score = overview?.healthScore ?? 0;
  const breakdown = overview?.breakdown ?? {};

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Merchant Success Score</p>
            <p className="text-5xl font-bold text-brand-700">{score}</p>
            <p className="text-xs text-slate-400">out of 100 · {benchmark?.percentile ?? '—'}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs sm:grid-cols-6">
            <ScorePill label="Fulfillment" value={breakdown.fulfillment} max={30} />
            <ScorePill label="Ratings" value={breakdown.ratings} max={20} />
            <ScorePill label="Inventory" value={breakdown.inventory} max={15} />
            <ScorePill label="Retention" value={breakdown.retention} max={15} />
            <ScorePill label="Delivery SLA" value={breakdown.deliverySla} max={10} />
            <ScorePill label="Campaigns" value={breakdown.campaign} max={10} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Action Center</h2>
        <div className="space-y-2">
          {(overview?.actionCenter ?? []).map((a: ActionItem) => (
            <div
              key={a.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-xl border bg-white p-4"
            >
              <div>
                <span className={`text-[10px] font-bold uppercase ${priorityColor(a.priority)}`}>
                  {a.priority}
                </span>
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-slate-500">{a.description}</p>
                {a.expectedImpact && (
                  <p className="mt-1 text-xs text-brand-600">{a.expectedImpact}</p>
                )}
              </div>
              {a.cta && (
                <Link href={a.cta} className="text-sm font-medium text-brand-600 hover:underline">
                  Take action →
                </Link>
              )}
            </div>
          ))}
          {(overview?.actionCenter ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No urgent actions — great job!</p>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 font-semibold">Key metrics</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Fulfillment rate" value={`${overview?.metrics?.fulfillmentRate ?? 0}%`} />
            <Metric label="Cancellation" value={`${overview?.metrics?.cancellationRate ?? 0}%`} />
            <Metric label="Avg rating" value={String(overview?.metrics?.averageRating ?? 0)} />
            <Metric label="Low stock SKUs" value={String(overview?.metrics?.lowStockSkus ?? 0)} />
            <Metric label="Visibility" value={`${overview?.metrics?.visibilityScore ?? 0}/100`} />
            <Metric label="Repeat buyers" value={`${overview?.metrics?.repeatCustomerPct ?? 0}%`} />
          </dl>
        </section>

        <section className="rounded-xl border bg-white p-4">
          <h3 className="mb-3 font-semibold">AI recommendations</h3>
          <ul className="space-y-2 text-sm">
            {(recommendations?.recommendations ?? []).slice(0, 6).map((r: RecItem, i: number) => (
              <li key={i} className="border-b border-slate-100 pb-2 last:border-0">
                <p className="font-medium">{r.title}</p>
                <p className="text-slate-500">{r.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 font-semibold">Expansion Opportunities</h3>
        <div className="space-y-2">
          {(expansionOpps ?? []).map((o: ExpansionOpp) => (
            <div key={o.id} className="rounded-lg border border-slate-100 p-3 text-sm">
              <p className="font-medium">{o.title}</p>
              <p className="text-slate-500">{o.description}</p>
              {o.impact && <p className="mt-1 text-xs text-brand-600">{o.impact}</p>}
            </div>
          ))}
          {(expansionOpps ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No expansion signals for this store yet.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <h3 className="mb-3 font-semibold">Search visibility</h3>
        <p className="text-2xl font-bold">{visibility?.visibilityScore ?? 0}/100</p>
        <p className="text-sm text-slate-500">
          CTR {visibility?.insights?.ctr ?? 0}% · {visibility?.insights?.impressions ?? 0} impressions (30d)
        </p>
        {(visibility?.hiddenLocalities ?? []).length > 0 && (
          <p className="mt-2 text-sm text-amber-700">
            Low visibility in: {visibility.hiddenLocalities.join(', ')}
          </p>
        )}
      </section>

      {(overview?.alerts ?? []).length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="mb-2 font-semibold">Alerts</h3>
          <ul className="space-y-1 text-sm">
            {overview.alerts.map((al: { id: string; title: string; message: string }) => (
              <li key={al.id}>
                <strong>{al.title}</strong> — {al.message}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ScorePill({ label, value, max }: { label: string; value?: number; max: number }) {
  const v = value ?? 0;
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <p className="text-slate-500">{label}</p>
      <p className="font-semibold">
        {v}/{max}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function priorityColor(p: string) {
  if (p === 'HIGH') return 'text-red-600';
  if (p === 'MEDIUM') return 'text-amber-600';
  return 'text-slate-500';
}

interface ActionItem {
  id: string;
  priority: string;
  title: string;
  description: string;
  expectedImpact?: string;
  cta?: string;
}

interface RecItem {
  title: string;
  detail: string;
}

interface ExpansionOpp {
  id: string;
  title: string;
  description: string;
  impact?: string;
  type?: string;
}

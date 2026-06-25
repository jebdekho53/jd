'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export function AdminSeoContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'seo'],
    queryFn: async () => {
      const res = await fetch('/api/admin/seo/overview');
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <DashboardShell title="SEO Command Center">
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}
      {data && (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-semibold">SEO</h2>
            <div className="grid gap-4 sm:grid-cols-4">
              <Stat label="Indexed pages" value={data.seo?.indexedPages ?? 0} />
              <Stat label="Organic traffic" value={data.seo?.metrics?.organicTraffic ?? 0} />
              <Stat label="CTR" value={`${data.seo?.metrics?.ctr ?? 0}%`} />
              <Stat label="Crawl (24h)" value={data.seo?.crawlHealth?.visits24h ?? 0} />
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">AEO</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="FAQs" value={data.aeo?.total ?? 0} />
              <Stat label="Featured" value={data.aeo?.featured ?? 0} />
              <Stat label="AEO score" value={Math.round(data.aeo?.avgAeoScore ?? 0)} />
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">GEO</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Entities" value={data.geo?.entityCount ?? 0} />
              <Stat label="Coverage" value={Math.round(data.geo?.avgCoverage ?? 0)} />
              <Stat label="GEO visibility" value={Math.round(data.seo?.metrics?.geoVisibilityScore ?? 0)} />
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Technical</h2>
            <p className="text-sm text-slate-600">Crawl health: {data.technical?.health ?? '—'}</p>
            <ul className="mt-2 text-sm text-slate-500">
              {(data.seo?.sitemapStatus ?? []).map((s: { type: string; urlCount: number }) => (
                <li key={s.type}>{s.type}: {s.urlCount} URLs</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

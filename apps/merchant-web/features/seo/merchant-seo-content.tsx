'use client';

import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

async function fetchSeo(path: string) {
  const res = await fetch(`/api/merchant/seo/${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function MerchantSeoContent() {
  const { data: overview } = useQuery({ queryKey: ['merchant', 'seo'], queryFn: () => fetchSeo('overview') });
  const { data: recs } = useQuery({ queryKey: ['merchant', 'seo', 'recs'], queryFn: () => fetchSeo('recommendations') });

  return (
    <DashboardLayout title="SEO Insights">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Visibility score" value={overview?.visibilityScore ?? 0} />
        <Stat label="Search impressions" value={overview?.searchImpressions ?? 0} />
        <Stat label="Top keywords" value={(overview?.topKeywords ?? []).length} />
      </div>
      <section className="mb-6 rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-semibold">Top keywords</h2>
        {(overview?.topKeywords ?? []).map((k: { keyword: string; impressions: number }) => (
          <p key={k.keyword} className="text-sm">{k.keyword} — {k.impressions} impressions</p>
        ))}
        {(overview?.topKeywords ?? []).length === 0 && <p className="text-sm text-slate-500">No keyword data yet.</p>}
      </section>
      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-semibold">Recommendations</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          {(recs?.recommendations ?? overview?.recommendations ?? []).map((r: string) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>
    </DashboardLayout>
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

'use client';

import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

interface CampaignRow {
  id: string;
  name: string;
  scope: string;
  status: string;
  stackMode: string;
  gmvGenerated: number;
  orderCount: number;
  impressionCount: number;
  store?: { name: string; slug: string };
}

interface CampaignAnalytics {
  summary: {
    totalCampaigns: number;
    totalGmv: number;
    redemptions: number;
    discountGiven: number;
  };
  leaderboard: Array<{ rank: number; name: string; gmvGenerated: number; conversion: number }>;
  fraud: { couponAbuseCandidates: number; offerAbuseCandidates: number };
}

async function fetchCampaigns(): Promise<CampaignRow[]> {
  const res = await adminFetch<{ success: boolean; data: CampaignRow[] }>('/api/admin/campaigns');
  return res.data;
}

async function fetchAnalytics(): Promise<CampaignAnalytics> {
  const res = await adminFetch<{ success: boolean; data: CampaignAnalytics }>(
    '/api/admin/campaigns/analytics',
  );
  return res.data;
}

export function CampaignsAdminContent() {
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['admin', 'campaigns'],
    queryFn: fetchCampaigns,
  });
  const { data: analytics } = useQuery({
    queryKey: ['admin', 'campaigns', 'analytics'],
    queryFn: fetchAnalytics,
  });

  return (
    <div className="space-y-8">
      {analytics && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Campaigns" value={analytics.summary.totalCampaigns} />
          <Stat label="GMV generated" value={`₹${analytics.summary.totalGmv.toLocaleString()}`} />
          <Stat label="Redemptions" value={analytics.summary.redemptions} />
          <Stat label="Fraud signals" value={analytics.fraud.offerAbuseCandidates} />
        </div>
      )}

      {analytics?.leaderboard && analytics.leaderboard.length > 0 && (
        <section className="rounded-xl border p-4">
          <h3 className="mb-3 font-semibold">Performance leaderboard</h3>
          <ol className="space-y-2 text-sm">
            {analytics.leaderboard.map((row) => (
              <li key={row.rank} className="flex justify-between">
                <span>
                  #{row.rank} {row.name}
                </span>
                <span className="text-muted-foreground">
                  ₹{row.gmvGenerated.toLocaleString()} · {row.conversion}% conv.
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h3 className="mb-3 font-semibold">All campaigns</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-left">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Stack</th>
                  <th className="p-3">Orders</th>
                  <th className="p-3">GMV</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="font-medium">{c.name}</div>
                      {c.store && <div className="text-xs text-muted-foreground">{c.store.name}</div>}
                    </td>
                    <td className="p-3">{c.scope}</td>
                    <td className="p-3">{c.status}</td>
                    <td className="p-3">{c.stackMode}</td>
                    <td className="p-3">{c.orderCount}</td>
                    <td className="p-3">₹{c.gmvGenerated.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

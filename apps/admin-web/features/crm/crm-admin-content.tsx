'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

type Tab = 'segments' | 'journeys' | 'campaigns' | 'notifications' | 'templates' | 'analytics';

const TABS: { id: Tab; label: string; path?: string }[] = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'segments', label: 'Segments', path: '/api/admin/crm/segments' },
  { id: 'journeys', label: 'Journeys', path: '/api/admin/crm/journeys' },
  { id: 'campaigns', label: 'Campaigns', path: '/api/admin/crm/campaigns' },
  { id: 'notifications', label: 'Notifications', path: '/api/admin/crm/notifications/deliveries' },
  { id: 'templates', label: 'Templates', path: '/api/admin/crm/templates' },
];

export function CrmAdminContent() {
  const [tab, setTab] = useState<Tab>('analytics');

  const { data: overview } = useQuery({
    queryKey: ['admin', 'crm', 'overview'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: OverviewData }>('/api/admin/crm/overview');
      return res.data;
    },
  });

  const active = TABS.find((t) => t.id === tab)!;
  const { data: listData } = useQuery({
    queryKey: ['admin', 'crm', tab],
    queryFn: async () => {
      if (!active.path) return null;
      const res = await adminFetch<{ success: boolean; data: unknown }>(active.path);
      return res.data;
    },
    enabled: tab !== 'analytics' && !!active.path,
  });

  const m = overview ?? {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Segment members" value={String(m.segments?.totalMembers ?? 0)} />
        <Stat label="Events (30d)" value={String(m.eventsCaptured ?? 0)} />
        <Stat label="Open rate" value={`${m.openRate ?? 0}%`} />
        <Stat label="CTR" value={`${m.ctr ?? 0}%`} />
        <Stat label="Conversion" value={`${m.conversionRate ?? 0}%`} />
        <Stat label="Revenue" value={`₹${m.revenue ?? 0}`} />
        <Stat label="Retention" value={`${m.retentionPct ?? 0}%`} />
        <Stat label="Campaign ROI" value={String(m.campaignRoi ?? 0)} />
        <Stat label="LTV estimate" value={`₹${m.ltvEstimate ?? 0}`} />
        <Stat label="CSAT" value={m.csat != null ? `${m.csat}%` : '—'} />
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? 'bg-admin-700 text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && (
        <p className="text-sm text-muted-foreground">
          Journey ROI and repeat purchase metrics refresh daily. Use Segments and Journeys tabs to manage automation.
        </p>
      )}

      {tab === 'segments' && Array.isArray(listData) && (
        <DataTable
          headers={['Code', 'Name', 'Members', 'Last refreshed']}
          rows={(listData as SegmentRow[]).map((s) => [
            s.code,
            s.name,
            String(s.memberCount),
            s.lastRefreshedAt ? new Date(s.lastRefreshedAt).toLocaleDateString() : '—',
          ])}
        />
      )}

      {tab === 'journeys' && Array.isArray(listData) && (
        <DataTable
          headers={['Code', 'Name', 'Trigger', 'Steps']}
          rows={(listData as JourneyRow[]).map((j) => [
            j.code,
            j.name,
            j.trigger,
            String(j.steps?.length ?? 0),
          ])}
        />
      )}

      {tab === 'campaigns' && listData != null && typeof listData === 'object' && !Array.isArray(listData) && (
        <CampaignsPanel data={listData as CampaignList} />
      )}

      {tab === 'notifications' && listData != null && typeof listData === 'object' && !Array.isArray(listData) && (
        <DataTable
          headers={['Channel', 'Status', 'Recipient']}
          rows={((listData as { items: DeliveryRow[] }).items ?? []).map((d) => [
            d.channel,
            d.status,
            d.recipient,
          ])}
        />
      )}

      {tab === 'templates' && Array.isArray(listData) && (
        <DataTable
          headers={['Code', 'Name', 'Channel', 'Category']}
          rows={(listData as TemplateRow[]).map((t) => [t.code, t.name, t.channel, t.category])}
        />
      )}
    </div>
  );
}

function CampaignsPanel({ data }: { data: CampaignList }) {
  return (
    <div className="space-y-4 text-sm">
      {(['push', 'email', 'sms', 'whatsapp'] as const).map((ch) => {
        const items = data[ch] ?? [];
        if (items.length === 0) return null;
        return (
          <section key={ch} className="rounded-xl border p-4">
            <h3 className="mb-2 font-semibold capitalize">{ch} campaigns</h3>
            <ul className="space-y-1">
              {items.map((c) => (
                <li key={c.id} className="flex justify-between">
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">{c.status}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3">{cell}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-muted-foreground">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

interface OverviewData {
  segments?: { totalMembers: number };
  eventsCaptured?: number;
  openRate?: number;
  ctr?: number;
  conversionRate?: number;
  revenue?: number;
  retentionPct?: number;
  campaignRoi?: number;
  ltvEstimate?: number;
  csat?: number | null;
}

interface SegmentRow {
  code: string;
  name: string;
  memberCount: number;
  lastRefreshedAt?: string;
}

interface JourneyRow {
  code: string;
  name: string;
  trigger: string;
  steps?: unknown[];
}

interface CampaignList {
  push?: Array<{ id: string; name: string; status: string }>;
  email?: Array<{ id: string; name: string; status: string }>;
  sms?: Array<{ id: string; name: string; status: string }>;
  whatsapp?: Array<{ id: string; name: string; status: string }>;
}

interface DeliveryRow {
  channel: string;
  status: string;
  recipient: string;
}

interface TemplateRow {
  code: string;
  name: string;
  channel: string;
  category: string;
}

'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ShieldCheck, UserX, WalletCards } from 'lucide-react';
import { adminFetch } from '@/services/api/admin-client';
import { Badge, Button, Input } from '@/design-system';

type Tab =
  | 'cases'
  | 'profiles'
  | 'referral'
  | 'wallet'
  | 'coupon'
  | 'cod'
  | 'rider'
  | 'merchant'
  | 'blocked';

const TABS: { id: Tab; label: string; category?: string }[] = [
  { id: 'cases', label: 'Fraud Cases' },
  { id: 'profiles', label: 'Risk Profiles' },
  { id: 'referral', label: 'Referral Abuse', category: 'REFERRAL_ABUSE' },
  { id: 'wallet', label: 'Wallet Abuse', category: 'WALLET_ABUSE' },
  { id: 'coupon', label: 'Coupon Abuse', category: 'COUPON_ABUSE' },
  { id: 'cod', label: 'COD Abuse', category: 'COD_ABUSE' },
  { id: 'rider', label: 'Rider Fraud', category: 'RIDER_FRAUD' },
  { id: 'merchant', label: 'Merchant Fraud', category: 'MERCHANT_FRAUD' },
  { id: 'blocked', label: 'Blocked Accounts' },
];

const PROFILE_STATUSES = ['', 'LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'BLOCKED'];

export function TrustSafetyAdminContent() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('cases');
  const [search, setSearch] = useState('');
  const [profileStatus, setProfileStatus] = useState('');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['admin', 'trust-safety', 'overview'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { metrics: Record<string, number>; alerts: AlertRow[] } }>(
        '/api/admin/trust-safety/overview',
      );
      return res.data;
    },
    refetchInterval: 60_000,
  });

  const activeTab = TABS.find((t) => t.id === tab);
  const category = activeTab?.category;

  const { data: cases, isLoading: casesLoading } = useQuery({
    queryKey: ['admin', 'trust-safety', 'cases', category],
    queryFn: async () => {
      const path = category
        ? `/api/admin/trust-safety/fraud-cases/${category}`
        : '/api/admin/trust-safety/fraud-cases';
      const res = await adminFetch<{ success: boolean; data: { items: CaseRow[]; total: number } }>(path);
      return res.data;
    },
    enabled: tab !== 'profiles' && tab !== 'blocked',
  });

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['admin', 'trust-safety', 'profiles', profileStatus],
    queryFn: async () => {
      const suffix = profileStatus ? `?status=${profileStatus}` : '';
      const res = await adminFetch<{ success: boolean; data: { items: ProfileRow[]; total: number } }>(
        `/api/admin/trust-safety/risk-profiles${suffix}`,
      );
      return res.data;
    },
    enabled: tab === 'profiles',
  });

  const { data: blocked, isLoading: blockedLoading } = useQuery({
    queryKey: ['admin', 'trust-safety', 'blocked'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { items: BlockedRow[]; total: number } }>(
        '/api/admin/trust-safety/blocked-accounts',
      );
      return res.data;
    },
    enabled: tab === 'blocked',
  });

  const resolveAlert = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/trust-safety/alerts/${id}/resolve`, { method: 'PATCH', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'trust-safety'] }),
  });

  const resolveCase = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/trust-safety/cases/${id}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ resolution: 'Resolved from admin command center', dismiss: false }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'trust-safety'] }),
  });

  const m = overview?.metrics ?? {};
  const caseRows = useMemo(() => filterRows(cases?.items ?? [], search, ['caseNumber', 'title', 'severity', 'category']), [cases, search]);
  const profileRows = useMemo(() => filterRows(profiles?.items ?? [], search, ['userId', 'status']), [profiles, search]);
  const blockedRows = useMemo(() => filterRows(blocked?.items ?? [], search, ['userId', 'restrictionType', 'reason']), [blocked, search]);
  const criticalAlerts = (overview?.alerts ?? []).filter((a) => ['CRITICAL', 'HIGH'].includes(a.severity));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trust & Safety</h1>
        <p className="text-sm text-muted-foreground">Fraud detection, risk profiles, account restrictions and automated enforcement</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RiskStat icon={AlertTriangle} label="Open cases" value={m.openCases ?? 0} loading={overviewLoading} tone="danger" />
        <RiskStat icon={UserX} label="Blocked users" value={m.blockedUsers ?? 0} loading={overviewLoading} tone="warning" />
        <RiskStat icon={ShieldCheck} label="Active restrictions" value={m.activeRestrictions ?? 0} loading={overviewLoading} tone="info" />
        <RiskStat icon={WalletCards} label="Fraud prevented" value={m.fraudPrevented ?? 0} loading={overviewLoading} tone="success" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <MiniStat label="Blocked merchants" value={m.blockedMerchants ?? 0} />
        <MiniStat label="Wallet abuse resolved" value={m.walletAbusePrevented ?? 0} />
        <MiniStat label="COD disabled buyers" value={m.codLossAvoided ?? 0} />
      </div>

      <section className="rounded-xl border bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="font-semibold">Real-time alerts</h2>
            <p className="text-sm text-slate-500">{criticalAlerts.length} high priority alerts</p>
          </div>
          <Badge tone={criticalAlerts.length ? 'danger' : 'success'} dot>
            {criticalAlerts.length ? 'Needs review' : 'Clear'}
          </Badge>
        </div>
        {!overview?.alerts?.length ? (
          <p className="p-4 text-sm text-slate-500">No open trust alerts.</p>
        ) : (
          <ul className="divide-y">
            {overview.alerts.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={a.severity === 'CRITICAL' || a.severity === 'HIGH' ? 'danger' : 'warning'} dot>
                      {a.severity}
                    </Badge>
                    <p className="font-medium text-slate-900">{a.title}</p>
                  </div>
                  {a.description && <p className="mt-1 text-sm text-slate-500">{a.description}</p>}
                </div>
                <Button size="sm" variant="outline" loading={resolveAlert.isPending} onClick={() => resolveAlert.mutate(a.id)}>
                  Resolve
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border bg-white p-3">
        <Input
          label="Search"
          placeholder="Case, user, reason, severity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[280px]"
        />
        {tab === 'profiles' && (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Profile status
            <select
              value={profileStatus}
              onChange={(e) => setProfileStatus(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm"
            >
              {PROFILE_STATUSES.map((s) => (
                <option key={s || 'all'} value={s}>{s || 'All statuses'}</option>
              ))}
            </select>
          </label>
        )}
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

      {tab === 'profiles' && (
        <ProfilesTable rows={profileRows} loading={profilesLoading} />
      )}

      {tab === 'blocked' && (
        <BlockedTable rows={blockedRows} loading={blockedLoading} />
      )}

      {tab !== 'profiles' && tab !== 'blocked' && (
        <CasesTable
          title={activeTab?.label ?? 'Cases'}
          rows={caseRows}
          loading={casesLoading}
          resolving={resolveCase.isPending}
          onResolve={(id) => resolveCase.mutate(id)}
        />
      )}
    </div>
  );
}

function filterRows<T extends object>(rows: T[], query: string, keys: (keyof T)[]) {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => keys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)));
}

function RiskStat({
  icon: Icon,
  label,
  value,
  loading,
  tone,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: string | number;
  loading?: boolean;
  tone: 'danger' | 'warning' | 'info' | 'success';
}) {
  const colors = {
    danger: 'bg-red-50 text-red-700',
    warning: 'bg-amber-50 text-amber-700',
    info: 'bg-sky-50 text-sky-700',
    success: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colors[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900">{loading ? '—' : value}</p>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs font-medium uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function CasesTable({
  title,
  rows,
  loading,
  resolving,
  onResolve,
}: {
  title: string;
  rows: CaseRow[];
  loading?: boolean;
  resolving: boolean;
  onResolve: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="border-b p-4">
        <h3 className="font-semibold">{title}</h3>
      </div>
      {loading ? (
        <p className="p-4 text-sm text-slate-500">Loading cases...</p>
      ) : !rows.length ? (
        <p className="p-4 text-sm text-slate-500">No records</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Case</th>
                <th className="p-3">Category</th>
                <th className="p-3">Severity</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="p-3">
                    <p className="font-medium">{c.caseNumber}</p>
                    <p className="text-xs text-slate-500">{c.title}</p>
                  </td>
                  <td className="p-3">{c.category ?? '—'}</td>
                  <td className="p-3">
                    <Badge tone={['CRITICAL', 'HIGH'].includes(c.severity) ? 'danger' : 'warning'}>{c.severity}</Badge>
                  </td>
                  <td className="p-3 text-xs text-slate-500">{c.userId ?? '—'}</td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" loading={resolving} onClick={() => onResolve(c.id)}>
                      Resolve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ProfilesTable({ rows, loading }: { rows: ProfileRow[]; loading?: boolean }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="border-b p-4">
        <h3 className="font-semibold">Risk profiles</h3>
      </div>
      {loading ? (
        <p className="p-4 text-sm text-slate-500">Loading profiles...</p>
      ) : !rows.length ? (
        <p className="p-4 text-sm text-slate-500">No records</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Status</th>
                <th className="p-3">Risk</th>
                <th className="p-3">Trust</th>
                <th className="p-3">COD</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-3 font-mono text-xs">{p.userId}</td>
                  <td className="p-3">
                    <Badge tone={p.status === 'BLOCKED' || p.status === 'HIGH_RISK' ? 'danger' : 'neutral'}>{p.status}</Badge>
                  </td>
                  <td className="p-3">{p.riskScore}</td>
                  <td className="p-3">{p.trustScore}</td>
                  <td className="p-3">{p.codEnabled === false ? 'Disabled' : 'Enabled'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function BlockedTable({ rows, loading }: { rows: BlockedRow[]; loading?: boolean }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <div className="border-b p-4">
        <h3 className="font-semibold">Blocked / restricted accounts</h3>
      </div>
      {loading ? (
        <p className="p-4 text-sm text-slate-500">Loading restricted accounts...</p>
      ) : !rows.length ? (
        <p className="p-4 text-sm text-slate-500">No records</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Restriction</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b">
                  <td className="p-3 font-mono text-xs">{b.userId ?? '—'}</td>
                  <td className="p-3"><Badge tone="danger">{b.restrictionType}</Badge></td>
                  <td className="p-3 text-xs text-slate-600">{b.reason}</td>
                  <td className="p-3 text-xs text-slate-500">{b.createdAt ? new Date(b.createdAt).toLocaleString('en-IN') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

interface AlertRow {
  id: string;
  title: string;
  severity: string;
  description?: string | null;
}
interface CaseRow {
  id: string;
  caseNumber: string;
  title: string;
  severity: string;
  category?: string;
  userId?: string | null;
}
interface ProfileRow {
  id: string;
  userId: string;
  status: string;
  riskScore: number;
  trustScore: number;
  codEnabled?: boolean;
}
interface BlockedRow {
  id: string;
  userId?: string | null;
  restrictionType: string;
  reason: string;
  createdAt?: string;
}

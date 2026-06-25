'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

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

export function TrustSafetyAdminContent() {
  const [tab, setTab] = useState<Tab>('cases');

  const { data: overview } = useQuery({
    queryKey: ['admin', 'trust-safety', 'overview'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { metrics: Record<string, number>; alerts: AlertRow[] } }>(
        '/api/admin/trust-safety/overview',
      );
      return res.data;
    },
  });

  const activeTab = TABS.find((t) => t.id === tab);
  const category = activeTab?.category;

  const { data: cases } = useQuery({
    queryKey: ['admin', 'trust-safety', 'cases', category],
    queryFn: async () => {
      const path = category
        ? `/api/admin/trust-safety/fraud-cases/${category}`
        : '/api/admin/trust-safety/fraud-cases';
      const res = await adminFetch<{ success: boolean; data: { items: CaseRow[] } }>(path);
      return res.data;
    },
    enabled: tab !== 'profiles' && tab !== 'blocked',
  });

  const { data: profiles } = useQuery({
    queryKey: ['admin', 'trust-safety', 'profiles'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { items: ProfileRow[] } }>(
        '/api/admin/trust-safety/risk-profiles',
      );
      return res.data;
    },
    enabled: tab === 'profiles',
  });

  const { data: blocked } = useQuery({
    queryKey: ['admin', 'trust-safety', 'blocked'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { items: BlockedRow[] } }>(
        '/api/admin/trust-safety/blocked-accounts',
      );
      return res.data;
    },
    enabled: tab === 'blocked',
  });

  const m = overview?.metrics ?? {};

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Open cases" value={String(m.openCases ?? 0)} />
        <Stat label="Fraud prevented" value={String(m.fraudPrevented ?? 0)} />
        <Stat label="Blocked users" value={String(m.blockedUsers ?? 0)} />
        <Stat label="Blocked merchants" value={String(m.blockedMerchants ?? 0)} />
        <Stat label="Wallet abuse prevented" value={String(m.walletAbusePrevented ?? 0)} />
        <Stat label="Referral abuse prevented" value={String(m.referralAbusePrevented ?? 0)} />
        <Stat label="COD disabled (buyers)" value={String(m.codLossAvoided ?? 0)} />
        <Stat label="Active restrictions" value={String(m.activeRestrictions ?? 0)} />
      </div>

      {(overview?.alerts ?? []).length > 0 && (
        <section className="rounded-xl border p-4">
          <h3 className="mb-2 font-semibold">Real-time alerts</h3>
          <ul className="space-y-2 text-sm">
            {overview!.alerts.map((a) => (
              <li key={a.id} className="flex justify-between border-t py-2">
                <span>{a.title}</span>
                <span className="text-xs text-muted-foreground">{a.severity}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
        <List title="Risk profiles" rows={(profiles?.items ?? []).map((p) => (
          <li key={p.id} className="flex justify-between border-t py-2 text-sm">
            <span>{p.userId.slice(0, 8)}… · {p.status}</span>
            <span>Risk {p.riskScore} · Trust {p.trustScore}</span>
          </li>
        ))} />
      )}

      {tab === 'blocked' && (
        <List title="Blocked / restricted accounts" rows={(blocked?.items ?? []).map((b) => (
          <li key={b.id} className="flex justify-between border-t py-2 text-sm">
            <span>{b.restrictionType}</span>
            <span className="text-muted-foreground">{b.reason.slice(0, 60)}</span>
          </li>
        ))} />
      )}

      {tab !== 'profiles' && tab !== 'blocked' && (
        <List title={activeTab?.label ?? 'Cases'} rows={(cases?.items ?? []).map((c) => (
          <li key={c.id} className="border-t py-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{c.caseNumber}</span>
              <span>{c.severity}</span>
            </div>
            <p className="text-muted-foreground">{c.title}</p>
          </li>
        ))} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function List({ title, rows }: { title: string; rows?: React.ReactNode[] }) {
  return (
    <section className="rounded-xl border p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {!rows?.length ? <p className="text-sm text-muted-foreground">No records</p> : <ul>{rows}</ul>}
    </section>
  );
}

interface AlertRow { id: string; title: string; severity: string }
interface CaseRow { id: string; caseNumber: string; title: string; severity: string }
interface ProfileRow { id: string; userId: string; status: string; riskScore: number; trustScore: number }
interface BlockedRow { id: string; restrictionType: string; reason: string }

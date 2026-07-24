'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';

async function adminFetch(path: string) {
  const res = await fetch(path);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

async function sendAdmin(path: string, body: unknown) {
  const res = await fetch(`/api/admin/supply-chain/${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function SupplyChainAdminContent() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['admin', 'supply-chain'],
    queryFn: () => adminFetch('/api/admin/supply-chain'),
  });

  const { data: vendors } = useQuery({
    queryKey: ['admin', 'vendors'],
    queryFn: () => adminFetch('/api/admin/supply-chain/vendors'),
  });

  const { data: orders } = useQuery({
    queryKey: ['admin', 'vendor-orders'],
    queryFn: () => adminFetch('/api/admin/supply-chain/vendor-orders'),
  });

  const { data: settlements } = useQuery({
    queryKey: ['admin', 'vendor-settlements'],
    queryFn: () => adminFetch('/api/admin/supply-chain/vendor-settlements'),
  });

  if (isLoading) return <p className="text-sm text-slate-400">Loading supply chain…</p>;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Widget label="Active Vendors" value={String(dashboard?.activeVendors ?? 0)} />
        <Widget label="Active Orders" value={String(dashboard?.activeOrders ?? 0)} />
        <Widget label="Pending Settlements" value={String(dashboard?.pendingSettlements ?? 0)} />
        <Widget label="Stock Shortages" value={String(dashboard?.inventoryShortages ?? 0)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top Vendors">
          {(dashboard?.topVendors ?? []).map((v: VendorRow) => (
            <div key={v.id} className="flex justify-between text-xs text-slate-300">
              <span>{v.businessName}</span>
              <span>★ {v.ratingAvg.toFixed(1)}</span>
            </div>
          ))}
        </Panel>
        <Panel title="Credit Risk">
          {(dashboard?.creditRisk ?? []).length === 0 && (
            <p className="text-xs text-slate-500">No overdue credit lines.</p>
          )}
          {(dashboard?.creditRisk ?? []).map((c: CreditRow) => (
            <div key={c.id} className="text-xs text-red-300">
              {c.vendor?.businessName} · {c.merchantProfile?.businessName} · ₹{Number(c.overdueAmount)}
            </div>
          ))}
        </Panel>
      </section>

      <VendorApplications />

      <Panel title="Vendor Registry">
        {(vendors ?? []).slice(0, 8).map((v: VendorListRow) => (
          <div key={v.id} className="flex justify-between text-xs text-slate-300">
            <span>{v.businessName} ({v.vendorType})</span>
            <span>{v._count?.products ?? 0} SKUs</span>
          </div>
        ))}
      </Panel>

      <Panel title="Vendor Orders">
        {(orders ?? []).slice(0, 8).map((o: OrderRow) => (
          <div key={o.id} className="flex justify-between text-xs text-slate-300">
            <span>{o.orderNumber} · {o.vendor?.businessName}</span>
            <span>{o.status}</span>
          </div>
        ))}
      </Panel>

      <Panel title="Settlements">
        {(settlements ?? []).slice(0, 6).map((s: SettlementRow) => (
          <div key={s.id} className="flex justify-between text-xs text-slate-300">
            <span>{s.vendor?.businessName}</span>
            <span>₹{Number(s.amount)} · {s.status}</span>
          </div>
        ))}
      </Panel>
    </div>
  );
}

type AppStatus = 'NEW' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
const APP_STATUSES: Array<'ALL' | AppStatus> = ['ALL', 'NEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

function VendorApplications() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'ALL' | AppStatus>('NEW');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: applications = [], isLoading } = useQuery<VendorApplicationRow[]>({
    queryKey: ['admin', 'vendor-applications', status],
    queryFn: () =>
      adminFetch(`/api/admin/supply-chain/vendor-applications${status === 'ALL' ? '' : `?status=${status}`}`),
  });

  const selected = useMemo(
    () => applications.find((a) => a.id === selectedId) ?? applications[0],
    [applications, selectedId],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'vendor-applications'] });

  const approve = useMutation({
    mutationFn: () => sendAdmin(`vendor-applications/${selected?.id}/approve`, {}),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: () =>
      sendAdmin(`vendor-applications/${selected?.id}/reject`, { reason: rejectReason }),
    onSuccess: async () => {
      setRejectReason('');
      await invalidate();
    },
  });

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(300px,420px)_1fr]">
      <Panel title="Vendor Applications">
        <div className="mb-4 flex flex-wrap gap-2">
          {APP_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-md px-3 py-1.5 text-xs ${status === s ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-300'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {applications.map((app) => (
            <button
              key={app.id}
              onClick={() => {
                setSelectedId(app.id);
                setRejectReason('');
              }}
              className={`w-full rounded-lg border p-3 text-left text-sm ${selected?.id === app.id ? 'border-emerald-400 bg-slate-900' : 'border-slate-700 bg-slate-800'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-white">{app.businessName}</span>
                <span className="text-xs text-slate-400">{app.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {app.vendorType} · {app.phone}
              </p>
            </button>
          ))}
          {isLoading && <p className="text-xs text-slate-500">Loading applications...</p>}
          {!isLoading && applications.length === 0 && (
            <p className="text-xs text-slate-500">No applications in this status.</p>
          )}
        </div>
      </Panel>

      <Panel title="Review">
        {selected ? (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="Business name" value={selected.businessName} />
              <Info label="Vendor type" value={selected.vendorType} />
              <Info label="Phone" value={selected.phone} />
              <Info label="Email" value={selected.email ?? '-'} />
              <Info label="GST number" value={selected.gstNumber ?? '-'} />
              <Info label="PAN number" value={selected.panNumber ?? '-'} />
              <Info label="Applied" value={new Date(selected.createdAt).toLocaleString()} />
            </div>
            <Info label="Notes" value={selected.notes ?? '-'} />
            {selected.rejectionReason && (
              <Info label="Rejection reason" value={selected.rejectionReason} />
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => approve.mutate()}
                disabled={approve.isPending || selected.status !== 'NEW' && selected.status !== 'UNDER_REVIEW'}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Approve
              </button>
              <input
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Reject reason"
                className="min-w-64 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
              />
              <button
                onClick={() => reject.mutate()}
                disabled={
                  reject.isPending ||
                  rejectReason.trim().length < 3 ||
                  (selected.status !== 'NEW' && selected.status !== 'UNDER_REVIEW')
                }
                className="inline-flex items-center gap-2 rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            </div>
            {(approve.error || reject.error) && (
              <p className="text-sm text-rose-300">{((approve.error ?? reject.error) as Error).message}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Select an application to review.</p>
        )}
      </Panel>
    </section>
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
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-100">{value}</p>
    </div>
  );
}

interface VendorRow { id: string; businessName: string; ratingAvg: number }
interface CreditRow { id: string; overdueAmount: number; vendor?: { businessName: string }; merchantProfile?: { businessName: string } }
interface VendorListRow { id: string; businessName: string; vendorType: string; _count?: { products: number } }
interface OrderRow { id: string; orderNumber: string; status: string; vendor?: { businessName: string } }
interface SettlementRow { id: string; amount: number; status: string; vendor?: { businessName: string } }
interface VendorApplicationRow {
  id: string;
  businessName: string;
  vendorType: string;
  phone: string;
  email?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  notes?: string | null;
  status: AppStatus;
  rejectionReason?: string | null;
  createdAt: string;
}

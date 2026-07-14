'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Copy, RefreshCw, X } from 'lucide-react';
import { OpsMapOverlay } from '@/features/maps/ops-map-overlay';
import { useOperationsMapQuery } from '@/features/maps/use-operations-map';
import { useGoogleMaps } from '@jebdekho/google-maps';

async function fetchExpansion(path: string) {
  const res = await fetch(path.startsWith('/api') ? path : `/api/admin/expansion/${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

async function sendExpansion(path: string, method: 'POST' | 'PATCH', body: unknown) {
  const res = await fetch(`/api/admin/expansion/${path}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'REJECTED';
const STATUSES: Array<'ALL' | LeadStatus> = ['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'REJECTED'];

export function ExpansionAdminContent() {
  const queryClient = useQueryClient();
  const { isConfigured, isLoaded } = useGoogleMaps();
  const { data: opsMap } = useOperationsMapQuery(60_000);
  const [status, setStatus] = useState<'ALL' | LeadStatus>('NEW');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pincodesText, setPincodesText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [approved, setApproved] = useState<ApprovalResult | null>(null);

  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin', 'expansion'],
    queryFn: () => fetchExpansion('/api/admin/expansion'),
  });
  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: ['admin', 'expansion', 'leads', status],
    queryFn: () => fetchExpansion(`leads${status === 'ALL' ? '' : `?status=${status}`}`),
  });

  const selected = useMemo(
    () => leads.find((lead) => lead.id === selectedId) ?? leads[0],
    [leads, selectedId],
  );
  const pincodes = useMemo(
    () => normalisePincodes(pincodesText || selected?.pincodes.join(',') || ''),
    [pincodesText, selected],
  );

  const conflicts = useQuery<ConflictPreview>({
    queryKey: ['admin', 'expansion', 'lead-conflicts', selected?.id, pincodes.join(',')],
    enabled: Boolean(selected?.id),
    queryFn: () => sendExpansion(`leads/${selected?.id}/conflicts`, 'POST', { pincodes }),
  });

  const approve = useMutation({
    mutationFn: () =>
      sendExpansion(`leads/${selected?.id}/approve`, 'PATCH', {
        pincodes,
        exclusivityEnabled: true,
        businessName: selected?.name,
      }),
    onSuccess: async (data: ApprovalResult) => {
      setApproved(data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'expansion'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'expansion', 'leads'] });
    },
  });

  const reject = useMutation({
    mutationFn: () => sendExpansion(`leads/${selected?.id}/reject`, 'PATCH', { reason: rejectReason }),
    onSuccess: async () => {
      setRejectReason('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'expansion', 'leads'] });
    },
  });

  const cities = overview?.cities ?? [];
  const franchises = overview?.franchises ?? [];
  const openConflicts = overview?.conflicts ?? [];
  const revenue = overview?.revenue ?? [];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Widget label="Active Franchises" value={String(overview?.active ?? 0)} />
        <Widget label="Pending" value={String(overview?.pending ?? 0)} />
        <Widget label="Suspended" value={String(overview?.suspended ?? 0)} />
        <Widget label="Open Conflicts" value={String(overview?.openConflicts ?? 0)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(300px,420px)_1fr]">
        <Panel title="Lead Queue">
          <div className="mb-4 flex flex-wrap gap-2">
            {STATUSES.map((s) => (
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
            {leads.map((lead) => (
              <button
                key={lead.id}
                onClick={() => {
                  setSelectedId(lead.id);
                  setPincodesText(lead.pincodes.join(', '));
                  setApproved(null);
                }}
                className={`w-full rounded-lg border p-3 text-left text-sm ${selected?.id === lead.id ? 'border-emerald-400 bg-slate-900' : 'border-slate-700 bg-slate-800'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-white">{lead.name}</span>
                  <span className="text-xs text-slate-400">{lead.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{lead.city}, {lead.state} · {lead.phone}</p>
              </button>
            ))}
            {leadsLoading && <p className="text-xs text-slate-500">Loading leads...</p>}
            {!leadsLoading && leads.length === 0 && <p className="text-xs text-slate-500">No leads in this status.</p>}
          </div>
        </Panel>

        <Panel title="Review">
          {selected ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <Info label="Name" value={selected.name} />
                <Info label="Phone" value={selected.phone} />
                <Info label="Email" value={selected.email ?? '-'} />
                <Info label="City/State" value={`${selected.city}, ${selected.state}`} />
                <Info label="Investment" value={selected.investmentCapacity ? `₹${Number(selected.investmentCapacity).toLocaleString()}` : '-'} />
                <Info label="Applied" value={new Date(selected.createdAt).toLocaleString()} />
              </div>
              <Info label="Notes" value={selected.notes ?? '-'} />
              {selected.convertedFranchise && (
                <ReferralResult
                  referralCode={selected.convertedFranchise.referralCode}
                  businessName={selected.convertedFranchise.businessName}
                />
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-300">Territory pincodes</span>
                <textarea
                  value={pincodesText || selected.pincodes.join(', ')}
                  onChange={(event) => setPincodesText(event.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-emerald-400"
                />
              </label>

              <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                  {conflicts.isFetching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4 text-amber-300" />}
                  Territory conflicts
                </div>
                {(conflicts.data?.conflicts ?? []).map((conflict) => (
                  <p key={`${conflict.territoryId}-${conflict.pincode}`} className="text-xs text-amber-200">
                    {conflict.pincode} overlaps {conflict.franchise.businessName} ({conflict.city}, {conflict.state})
                  </p>
                ))}
                {conflicts.data && conflicts.data.conflicts.length === 0 && (
                  <p className="text-xs text-emerald-300">No exclusive-territory conflicts for these pincodes.</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => approve.mutate()}
                  disabled={approve.isPending || selected.status === 'CONVERTED'}
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
                  disabled={reject.isPending || rejectReason.trim().length < 3 || selected.status === 'CONVERTED'}
                  className="inline-flex items-center gap-2 rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
              {(approve.error || reject.error) && (
                <p className="text-sm text-rose-300">{((approve.error ?? reject.error) as Error).message}</p>
              )}
              {approved && <ReferralResult referralCode={approved.referralCode} businessName={approved.partner.businessName} />}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select a lead to review.</p>
          )}
        </Panel>
      </section>

      {opsMap && isConfigured && isLoaded && (
        <section className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Franchise territories map</h2>
          <OpsMapOverlay data={opsMap} showRiders={false} showUnassigned={false} showZones={false} showFranchise />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Franchise Partners">
          {franchises.map((f: FranchiseRow) => (
            <div key={f.id} className="mb-2 flex justify-between text-xs text-slate-300">
              <span>{f.businessName}</span>
              <span>{f.status} · {f.commissionPercent}%</span>
            </div>
          ))}
          {franchises.length === 0 && <p className="text-xs text-slate-500">No franchise partners yet.</p>}
        </Panel>
        <Panel title="Open Territory Conflicts">
          {openConflicts.map((c: ConflictRow) => (
            <div key={c.id} className="mb-2 text-xs text-amber-300">
              Pincode {c.pincode} · {c.franchise?.businessName}
            </div>
          ))}
          {openConflicts.length === 0 && <p className="text-xs text-slate-500">No open conflicts.</p>}
        </Panel>
        <Panel title="Franchise Revenue">
          {revenue.slice(0, 8).map((r: RevenueRow) => (
            <div key={r.id} className="mb-2 flex justify-between text-xs text-slate-300">
              <span>{r.franchise?.businessName}</span>
              <span>₹{Number(r.franchiseShare)} · {r.status}</span>
            </div>
          ))}
        </Panel>
      </section>

      {cities.length > 0 && (
        <section className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Cities - Launch Status</h2>
          {cities.map((c: CityRow) => (
            <div key={c.id} className="flex justify-between text-xs text-slate-300">
              <span>{c.city}, {c.state}</span>
              <span>{c.launchStatus} · Score {Math.round(c.readinessScore)}</span>
            </div>
          ))}
        </section>
      )}

      {isLoading && <p className="text-sm text-slate-400">Loading expansion tower...</p>}
    </div>
  );
}

function ReferralResult({ referralCode, businessName }: { referralCode?: string | null; businessName: string }) {
  const inviteUrl = referralCode ? `https://merchant.jebdekho.com/?ref=${encodeURIComponent(referralCode)}` : '';
  return (
    <div className="rounded-lg border border-emerald-700 bg-emerald-950/40 p-3">
      <p className="text-sm font-semibold text-emerald-100">{businessName}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-200">
        <span>{referralCode ?? 'Referral code pending'}</span>
        {inviteUrl && (
          <button onClick={() => navigator.clipboard.writeText(inviteUrl)} className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 font-semibold text-slate-950">
            <Copy className="h-3.5 w-3.5" />
            Copy link
          </button>
        )}
      </div>
    </div>
  );
}

function Widget({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-200">{title}</h2>
      {children}
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

function normalisePincodes(input: string) {
  return [...new Set(input.split(/[\s,]+/).map((p) => p.trim()).filter((p) => /^\d{6}$/.test(p)))];
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  city: string;
  state: string;
  pincodes: string[];
  investmentCapacity?: number | string | null;
  status: LeadStatus;
  notes?: string | null;
  createdAt: string;
  convertedFranchise?: { id: string; businessName: string; referralCode?: string | null } | null;
}
interface ApprovalResult {
  partner: { id: string; businessName: string };
  referralCode: string;
}
interface ConflictPreview {
  pincodes: string[];
  conflicts: Array<{
    pincode: string;
    territoryId: string;
    franchiseId: string;
    city: string;
    state: string;
    franchise: { id: string; businessName: string; referralCode?: string | null };
  }>;
}
interface FranchiseRow { id: string; businessName: string; status: string; commissionPercent: number }
interface CityRow { id: string; city: string; state: string; launchStatus: string; readinessScore: number }
interface ConflictRow { id: string; pincode: string; franchise?: { businessName: string } }
interface RevenueRow { id: string; franchiseShare: number; status: string; franchise?: { businessName: string } }

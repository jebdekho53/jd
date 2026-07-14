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
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payoutResult, setPayoutResult] = useState<PayoutResult | null>(null);
  const [rejectDocId, setRejectDocId] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState('');

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

  const verifyBank = useMutation({
    mutationFn: (franchiseId: string) => {
      setVerifyingId(franchiseId);
      return sendExpansion(`franchise/${franchiseId}/bank-account/verify`, 'PATCH', {});
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'expansion'] }),
  });

  const pay = useMutation({
    mutationFn: (settlementId: string) => {
      setPayingId(settlementId);
      return sendExpansion(`settlements/${settlementId}/pay`, 'PATCH', {});
    },
    onSuccess: async (data: PayoutResult) => {
      setPayoutResult(data);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'expansion'] });
    },
  });

  const { data: pendingDocs = [] } = useQuery<PendingDoc[]>({
    queryKey: ['admin', 'expansion', 'documents'],
    queryFn: () => fetchExpansion('documents/pending'),
  });

  const invalidateKyc = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'expansion', 'documents'] });
    // Verifying a document can flip the partner's onboarding flag, so refresh those too.
    await queryClient.invalidateQueries({ queryKey: ['admin', 'expansion'] });
  };

  const verifyDoc = useMutation({
    mutationFn: (id: string) => sendExpansion(`documents/${id}/verify`, 'PATCH', {}),
    onSuccess: invalidateKyc,
  });

  const rejectDoc = useMutation({
    mutationFn: (id: string) =>
      sendExpansion(`documents/${id}/reject`, 'PATCH', { reason: docRejectReason }),
    onSuccess: async () => {
      setRejectDocId(null);
      setDocRejectReason('');
      await invalidateKyc();
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

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Franchise Partners">
          {franchises.map((f: FranchiseRow) => (
            <div
              key={f.id}
              className="mb-3 flex items-center justify-between gap-3 border-b border-slate-700/60 pb-3 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-200">{f.businessName}</p>
                <p className="text-[11px] text-slate-400">
                  {f.status} · {f.commissionPercent}% ·{' '}
                  {f.bankAccount ? (
                    f.bankAccount.verified ? (
                      <span className="text-emerald-400">
                        Bank {f.bankAccount.accountNumber} verified
                      </span>
                    ) : (
                      <span className="text-amber-400">Bank added, not verified</span>
                    )
                  ) : (
                    <span className="text-slate-500">No bank account</span>
                  )}
                </p>
              </div>

              {/* A partner cannot be paid until the bank account is verified — that
                  is what creates the Razorpay account we transfer into. */}
              {f.bankAccount && !f.bankAccount.verified && (
                <button
                  onClick={() => verifyBank.mutate(f.id)}
                  disabled={verifyBank.isPending && verifyingId === f.id}
                  className="shrink-0 rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {verifyBank.isPending && verifyingId === f.id ? 'Verifying…' : 'Verify bank'}
                </button>
              )}
            </div>
          ))}
          {franchises.length === 0 && <p className="text-xs text-slate-500">No franchise partners yet.</p>}
          {verifyBank.isError && (
            <p className="mt-2 rounded-md bg-red-500/10 px-2 py-1 text-[11px] text-red-300">
              {(verifyBank.error as Error).message}
            </p>
          )}
        </Panel>

        <Panel title="Open Territory Conflicts">
          {openConflicts.map((c: ConflictRow) => (
            <div key={c.id} className="mb-2 text-xs text-amber-300">
              Pincode {c.pincode} · {c.franchise?.businessName}
            </div>
          ))}
          {openConflicts.length === 0 && <p className="text-xs text-slate-500">No open conflicts.</p>}
        </Panel>
      </section>

      {/* KYC review — nothing gets paid until PAN + cheque are verified here. */}
      <section className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-200">KYC Documents — Pending Review</h2>
        <p className="mb-3 text-xs text-slate-500">
          A partner cannot be paid until their PAN is verified — without it, TDS must be
          withheld at 20% instead of 5%.
        </p>

        {pendingDocs.length === 0 && (
          <p className="text-xs text-slate-500">Nothing waiting for review.</p>
        )}

        <div className="space-y-2">
          {pendingDocs.map((d: PendingDoc) => (
            <div
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-700/60 bg-slate-900/40 p-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-200">
                  {d.franchise?.businessName} · {DOC_LABEL[d.documentType] ?? d.documentType}
                </p>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-300 hover:text-emerald-200"
                >
                  {d.fileName} ↗
                </a>
              </div>

              <div className="flex items-center gap-2">
                <input
                  value={rejectDocId === d.id ? docRejectReason : ''}
                  onChange={(e) => {
                    setRejectDocId(d.id);
                    setDocRejectReason(e.target.value);
                  }}
                  placeholder="Reason (to reject)"
                  className="w-44 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-200 placeholder:text-slate-600"
                />
                <button
                  onClick={() => rejectDoc.mutate(d.id)}
                  disabled={rejectDocId !== d.id || docRejectReason.trim().length < 3}
                  className="rounded-md border border-red-500/40 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-40"
                >
                  Reject
                </button>
                <button
                  onClick={() => verifyDoc.mutate(d.id)}
                  disabled={verifyDoc.isPending}
                  className="rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  Verify
                </button>
              </div>
            </div>
          ))}
        </div>

        {(verifyDoc.isError || rejectDoc.isError) && (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {((verifyDoc.error ?? rejectDoc.error) as Error).message}
          </p>
        )}
      </section>

      {/* Settlements & payouts — the money actually leaving the platform. */}
      <section className="rounded-lg border border-slate-700 bg-slate-800 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-200">Settlements &amp; Payouts</h2>

        {revenue.length === 0 && (
          <p className="text-xs text-slate-500">
            No settlements yet. They are generated monthly, or on demand.
          </p>
        )}

        {revenue.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="text-slate-400">
                <tr className="border-b border-slate-700">
                  <th className="pb-2 pr-3 font-medium">Partner</th>
                  <th className="pb-2 pr-3 font-medium">Period</th>
                  <th className="pb-2 pr-3 text-right font-medium">Share</th>
                  <th className="pb-2 pr-3 text-right font-medium">GST</th>
                  <th className="pb-2 pr-3 text-right font-medium">TDS</th>
                  <th className="pb-2 pr-3 text-right font-medium">Net to bank</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {revenue.map((r: RevenueRow) => (
                  <tr key={r.id} className="border-b border-slate-700/50 text-slate-300">
                    <td className="py-2 pr-3">{r.franchise?.businessName ?? '—'}</td>
                    <td className="py-2 pr-3 text-slate-400">
                      {r.periodEnd ? new Date(r.periodEnd).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2 pr-3 text-right">{money(r.franchiseShare)}</td>
                    <td className="py-2 pr-3 text-right text-slate-400">{money(r.gstAmount)}</td>
                    <td className="py-2 pr-3 text-right text-amber-300">−{money(r.tdsAmount)}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-white">
                      {money(r.netPayable)}
                    </td>
                    <td className="py-2 pr-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="py-2">
                      {r.status !== 'PAID' && Number(r.netPayable) > 0 && (
                        <button
                          onClick={() => pay.mutate(r.id)}
                          disabled={pay.isPending && payingId === r.id}
                          className="rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                        >
                          {pay.isPending && payingId === r.id ? 'Paying…' : 'Pay now'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pay.isError && (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {(pay.error as Error).message}
          </p>
        )}
        {pay.isSuccess && (
          <p className="mt-3 rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            Payout sent. Transfer {payoutResult?.razorpayTransferId ?? '—'} ·{' '}
            {money(payoutResult?.netAmount)} to the partner&apos;s bank.
          </p>
        )}
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

/** Decimals arrive from Prisma as strings — coerce before formatting. */
function money(value: number | string | null | undefined) {
  return `₹${Number(value ?? 0).toFixed(2)}`;
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'PAID'
      ? 'bg-emerald-500/15 text-emerald-300'
      : status === 'FAILED'
        ? 'bg-red-500/15 text-red-300'
        : 'bg-slate-600/30 text-slate-300';
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${tone}`}>{status}</span>;
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
interface FranchiseRow {
  id: string;
  businessName: string;
  status: string;
  commissionPercent: number;
  /** accountNumber arrives already masked from the API. */
  bankAccount?: { accountNumber: string; ifsc: string; verified: boolean } | null;
}
interface CityRow { id: string; city: string; state: string; launchStatus: string; readinessScore: number }
interface ConflictRow { id: string; pincode: string; franchise?: { businessName: string } }
interface RevenueRow {
  id: string;
  franchiseShare: number | string;
  gstAmount: number | string;
  tdsAmount: number | string;
  netPayable: number | string;
  periodEnd?: string;
  status: string;
  franchise?: { businessName: string };
}
const DOC_LABEL: Record<string, string> = {
  PAN_CARD: 'PAN card',
  CANCELLED_CHEQUE: 'Cancelled cheque',
  GST_CERTIFICATE: 'GST certificate',
  AADHAAR: 'Aadhaar',
  ADDRESS_PROOF: 'Address proof',
  SIGNED_AGREEMENT: 'Signed agreement',
  OTHER: 'Other',
};

interface PendingDoc {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  franchise?: { id: string; businessName: string; referralCode?: string | null };
}

interface PayoutResult {
  id: string;
  status: string;
  netAmount: number | string;
  razorpayTransferId?: string | null;
}

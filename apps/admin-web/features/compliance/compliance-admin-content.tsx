'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/services/api/admin-client';

type Tab = 'gst' | 'invoices' | 'credit-notes' | 'debit-notes' | 'tds' | 'tcs' | 'reports';

const TABS: { id: Tab; label: string }[] = [
  { id: 'gst', label: 'GST' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'credit-notes', label: 'Credit Notes' },
  { id: 'debit-notes', label: 'Debit Notes' },
  { id: 'tds', label: 'TDS' },
  { id: 'tcs', label: 'TCS' },
  { id: 'reports', label: 'Tax Reports' },
];

export function ComplianceAdminContent() {
  const [tab, setTab] = useState<Tab>('gst');

  const { data: overview } = useQuery({
    queryKey: ['admin', 'compliance', 'overview'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: Record<string, unknown> }>(
        '/api/admin/compliance/overview',
      );
      return res.data;
    },
  });

  const { data: rates } = useQuery({
    queryKey: ['admin', 'compliance', 'rates'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: unknown[] }>('/api/admin/compliance/gst/rates');
      return res.data;
    },
    enabled: tab === 'gst',
  });

  const { data: invoices } = useQuery({
    queryKey: ['admin', 'compliance', 'invoices'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { items: InvoiceRow[] } }>(
        '/api/admin/compliance/invoices',
      );
      return res.data;
    },
    enabled: tab === 'invoices',
  });

  const { data: creditNotes } = useQuery({
    queryKey: ['admin', 'compliance', 'credit-notes'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { items: unknown[] } }>(
        '/api/admin/compliance/credit-notes',
      );
      return res.data;
    },
    enabled: tab === 'credit-notes',
  });

  const { data: debitNotes } = useQuery({
    queryKey: ['admin', 'compliance', 'debit-notes'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { items: unknown[] } }>(
        '/api/admin/compliance/debit-notes',
      );
      return res.data;
    },
    enabled: tab === 'debit-notes',
  });

  const { data: tds } = useQuery({
    queryKey: ['admin', 'compliance', 'tds'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: unknown[] }>('/api/admin/compliance/tds');
      return res.data;
    },
    enabled: tab === 'tds',
  });

  const { data: tcs } = useQuery({
    queryKey: ['admin', 'compliance', 'tcs'],
    queryFn: async () => {
      const res = await adminFetch<{ success: boolean; data: { records: unknown[]; totalTcs: number } }>(
        '/api/admin/compliance/tcs',
      );
      return res.data;
    },
    enabled: tab === 'tcs',
  });

  const mtd = (overview?.monthToDate ?? {}) as Record<string, number>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Invoices (MTD)" value={String(mtd.invoices ?? 0)} />
        <Stat label="Taxable sales" value={`₹${(mtd.taxableSales ?? 0).toLocaleString()}`} />
        <Stat label="GST collected" value={`₹${(mtd.gstCollected ?? 0).toLocaleString()}`} />
        <Stat label="Credit notes" value={String(mtd.creditNotes ?? 0)} />
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              tab === t.id ? 'bg-admin-700 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'gst' && (
        <section className="rounded-xl border p-4">
          <h3 className="mb-3 font-semibold">GST rate slabs</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2">Slab</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>IGST</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(rates as RateRow[] | undefined)?.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.slab}</td>
                  <td>{r.cgstRate}%</td>
                  <td>{r.sgstRate}%</td>
                  <td>{r.igstRate}%</td>
                  <td>{r.totalRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'invoices' && (
        <ListSection
          title="Invoice register"
          rows={(invoices?.items ?? []).map((i) => (
            <li key={i.id} className="flex justify-between py-2 text-sm border-t">
              <span>{i.invoiceNumber}</span>
              <span>₹{i.grandTotal.toLocaleString()} · {new Date(i.invoiceDate).toLocaleDateString()}</span>
            </li>
          ))}
          exportHref="/api/admin/compliance/reports/invoice-register?format=csv"
        />
      )}

      {tab === 'credit-notes' && (
        <ListSection
          title="Credit notes"
          rows={(creditNotes?.items as CreditRow[] | undefined)?.map((n) => (
            <li key={n.id} className="flex justify-between py-2 text-sm border-t">
              <span>{n.creditNoteNumber}</span>
              <span>₹{Number(n.grandTotal).toLocaleString()}</span>
            </li>
          ))}
          exportHref="/api/admin/compliance/reports/credit-note-register?format=csv"
        />
      )}

      {tab === 'debit-notes' && (
        <ListSection
          title="Debit notes"
          rows={(debitNotes?.items as DebitRow[] | undefined)?.map((n) => (
            <li key={n.id} className="flex justify-between py-2 text-sm border-t">
              <span>{n.debitNoteNumber}</span>
              <span>₹{Number(n.grandTotal).toLocaleString()}</span>
            </li>
          ))}
        />
      )}

      {tab === 'tds' && (
        <section className="rounded-xl border p-4">
          <h3 className="mb-3 font-semibold">Merchant TDS</h3>
          <ul className="space-y-1 text-sm">
            {(tds as TdsRow[] | undefined)?.map((r) => (
              <li key={r.id} className="flex justify-between border-t py-2">
                <span>{r.merchant} · {r.periodMonth}</span>
                <span>₹{r.tdsAmount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'tcs' && (
        <section className="rounded-xl border p-4">
          <h3 className="mb-3 font-semibold">Platform TCS</h3>
          <p className="mb-2 text-sm">Total TCS: ₹{(tcs?.totalTcs ?? 0).toLocaleString()}</p>
          <ul className="space-y-1 text-sm">
            {(tcs?.records as TcsRow[] | undefined)?.map((r, i) => (
              <li key={i} className="flex justify-between border-t py-2">
                <span>{r.periodMonth}</span>
                <span>GMV ₹{r.gmvAmount.toLocaleString()} · TCS ₹{r.tcsAmount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'reports' && (
        <section className="rounded-xl border p-4 space-y-3">
          <h3 className="font-semibold">Exports</h3>
          <ReportLink href="/api/admin/compliance/reports/monthly-gst?format=pdf" label="Monthly GST Summary (PDF)" />
          <ReportLink href="/api/admin/compliance/reports/invoice-register?format=csv" label="Invoice Register (CSV)" />
          <ReportLink href="/api/admin/compliance/reports/credit-note-register?format=csv" label="Credit Note Register (CSV)" />
          <ReportLink href="/api/admin/compliance/reports/tax-liability?format=pdf" label="Tax Liability Report (PDF)" />
        </section>
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

function ListSection({
  title,
  rows,
  exportHref,
}: {
  title: string;
  rows?: React.ReactNode[];
  exportHref?: string;
}) {
  return (
    <section className="rounded-xl border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {exportHref && (
          <a href={exportHref} className="text-sm text-admin-700 hover:underline">
            Export CSV
          </a>
        )}
      </div>
      {!rows?.length ? (
        <p className="text-sm text-muted-foreground">No records</p>
      ) : (
        <ul>{rows}</ul>
      )}
    </section>
  );
}

function ReportLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="block text-sm text-admin-700 hover:underline">
      {label}
    </a>
  );
}

interface RateRow { id: string; slab: string; cgstRate: number; sgstRate: number; igstRate: number; totalRate: number }
interface InvoiceRow { id: string; invoiceNumber: string; grandTotal: number; invoiceDate: string }
interface CreditRow { id: string; creditNoteNumber: string; grandTotal: number }
interface DebitRow { id: string; debitNoteNumber: string; grandTotal: number }
interface TdsRow { id: string; merchant: string; periodMonth: string; tdsAmount: number }
interface TcsRow { periodMonth: string; gmvAmount: number; tcsAmount: number }

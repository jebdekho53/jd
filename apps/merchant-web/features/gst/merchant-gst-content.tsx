'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { merchantFetch } from '@/services/api/merchant-client';

type Tab = 'overview' | 'credit-notes' | 'debit-notes';

export function MerchantGstContent() {
  const [tab, setTab] = useState<Tab>('overview');

  const { data } = useQuery({
    queryKey: ['merchant', 'gst', 'overview'],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: GstOverview }>(
        '/api/merchant/gst/overview',
      );
      return res.data;
    },
  });

  const { data: creditNotes } = useQuery({
    queryKey: ['merchant', 'gst', 'credit-notes'],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: { items: CreditNoteRow[] } }>(
        '/api/merchant/gst/credit-notes',
      );
      return res.data;
    },
    enabled: tab === 'credit-notes',
  });

  const { data: debitNotes } = useQuery({
    queryKey: ['merchant', 'gst', 'debit-notes'],
    queryFn: async () => {
      const res = await merchantFetch<{ success: boolean; data: { items: DebitNoteRow[] } }>(
        '/api/merchant/gst/debit-notes',
      );
      return res.data;
    },
    enabled: tab === 'debit-notes',
  });

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Invoices" value={String(summary?.invoiceCount ?? 0)} />
        <Stat label="Taxable sales" value={`₹${(summary?.taxableSales ?? 0).toLocaleString()}`} />
        <Stat label="GST collected" value={`₹${(summary?.gstCollected ?? 0).toLocaleString()}`} />
        <Stat label="Gross total" value={`₹${(summary?.grossTotal ?? 0).toLocaleString()}`} />
      </div>

      <div className="flex gap-2 border-b">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')}>
          Invoices
        </TabButton>
        <TabButton active={tab === 'credit-notes'} onClick={() => setTab('credit-notes')}>
          Credit Notes
        </TabButton>
        <TabButton active={tab === 'debit-notes'} onClick={() => setTab('debit-notes')}>
          Debit Notes
        </TabButton>
      </div>

      {tab === 'overview' && (
        <>
          <section className="rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Recent invoices</h3>
              <a
                href="/api/merchant/gst/reports/summary?format=csv"
                className="text-sm text-brand-700 hover:underline"
              >
                Export summary
              </a>
            </div>
            <ul className="divide-y text-sm">
              {(data?.recentInvoices ?? []).map((inv) => (
                <li key={inv.id} className="flex justify-between py-2">
                  <span>{inv.invoiceNumber} · #{inv.orderNumber}</span>
                  <span className="flex items-center gap-3">
                    ₹{inv.grandTotal.toLocaleString()}
                    <a
                      href={`/api/merchant/gst/invoices/${inv.id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-700 hover:underline"
                    >
                      Download
                    </a>
                  </span>
                </li>
              ))}
              {(data?.recentInvoices ?? []).length === 0 && (
                <li className="py-4 text-center text-muted-foreground">No invoices yet.</li>
              )}
            </ul>
          </section>

          {data?.tds && (
            <section className="rounded-xl border p-4">
              <h3 className="mb-2 font-semibold">TDS summary</h3>
              <p className="text-sm text-muted-foreground">Total TDS: ₹{data.tds.totalTds.toLocaleString()}</p>
            </section>
          )}
        </>
      )}

      {tab === 'credit-notes' && (
        <section className="rounded-xl border p-4">
          <h3 className="mb-3 font-semibold">Credit notes</h3>
          <ul className="divide-y text-sm">
            {(creditNotes?.items ?? []).map((n) => (
              <li key={n.id} className="flex justify-between py-2">
                <span>{n.creditNoteNumber} · #{n.invoiceNumber}</span>
                <span className="flex items-center gap-3">
                  ₹{n.grandTotal.toLocaleString()}
                  <a
                    href={`/api/merchant/gst/credit-notes/${n.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 hover:underline"
                  >
                    Download
                  </a>
                </span>
              </li>
            ))}
            {(creditNotes?.items ?? []).length === 0 && (
              <li className="py-4 text-center text-muted-foreground">No credit notes yet.</li>
            )}
          </ul>
        </section>
      )}

      {tab === 'debit-notes' && (
        <section className="rounded-xl border p-4">
          <h3 className="mb-3 font-semibold">Debit notes</h3>
          <ul className="divide-y text-sm">
            {(debitNotes?.items ?? []).map((n) => (
              <li key={n.id} className="flex justify-between py-2">
                <span>{n.debitNoteNumber}</span>
                <span>₹{n.grandTotal.toLocaleString()}</span>
              </li>
            ))}
            {(debitNotes?.items ?? []).length === 0 && (
              <li className="py-4 text-center text-muted-foreground">No debit notes yet.</li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
        active ? 'border-brand-700 text-brand-700' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
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

interface GstOverview {
  summary: {
    invoiceCount: number;
    taxableSales: number;
    gstCollected: number;
    grossTotal: number;
  };
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    orderNumber: string;
    grandTotal: number;
  }>;
  tds: { totalTds: number };
}

interface CreditNoteRow {
  id: string;
  creditNoteNumber: string;
  invoiceNumber: string;
  grandTotal: number;
  reason: string;
  issuedAt: string;
}

interface DebitNoteRow {
  id: string;
  debitNoteNumber: string;
  grandTotal: number;
  reason: string;
  issuedAt: string;
}

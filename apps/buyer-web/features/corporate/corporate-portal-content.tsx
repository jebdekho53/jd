'use client';

import { useQuery } from '@tanstack/react-query';

async function fetchCorp(path: string) {
  const res = await fetch(`/api/corporate/${path}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Failed');
  return json.data;
}

export function CorporatePortalContent() {
  const { data: accounts } = useQuery({ queryKey: ['corporate', 'accounts'], queryFn: () => fetchCorp('accounts') });
  const { data: wallet } = useQuery({ queryKey: ['corporate', 'wallet'], queryFn: () => fetchCorp('wallet') });
  const { data: invoices } = useQuery({ queryKey: ['corporate', 'invoices'], queryFn: () => fetchCorp('invoices') });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Corporate Commerce</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-4">
          <p className="text-xs text-slate-500">Wallet balance</p>
          <p className="text-xl font-bold">₹{wallet?.balance ?? 0}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-slate-500">Accounts</p>
          <p className="text-xl font-bold">{(accounts ?? []).length}</p>
        </div>
      </div>
      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Invoices</h2>
        {(invoices ?? []).map((inv: { id: string; invoiceNumber: string; invoiceAmount: number }) => (
          <div key={inv.id} className="text-sm">{inv.invoiceNumber} — ₹{Number(inv.invoiceAmount)}</div>
        ))}
        {(invoices ?? []).length === 0 && <p className="text-sm text-slate-500">No invoices yet.</p>}
      </section>
    </div>
  );
}

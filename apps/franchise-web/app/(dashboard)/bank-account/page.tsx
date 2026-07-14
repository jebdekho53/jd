'use client';

import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

interface BankAccount {
  accountHolderName: string;
  /** Already masked by the API — the full number is never sent to the client. */
  accountNumber: string;
  ifsc: string;
  bankName?: string | null;
  verified: boolean;
}

const INPUT =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none';

function BankAccountInner() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ accountHolderName: '', accountNumber: '', ifsc: '', bankName: '' });
  const [editing, setEditing] = useState(false);

  const { data: bank, isLoading } = useQuery<BankAccount | null>({
    queryKey: ['franchise', 'bank-account'],
    queryFn: async () => {
      const res = await fetch('/api/franchise/bank-account');
      const json = await res.json();
      return json.data ?? null;
    },
  });

  useEffect(() => {
    if (bank && !editing) {
      setForm({
        accountHolderName: bank.accountHolderName,
        accountNumber: '',
        ifsc: bank.ifsc,
        bankName: bank.bankName ?? '',
      });
    }
  }, [bank, editing]);

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/franchise/bank-account', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Could not save the account');
      return json.data as BankAccount;
    },
    onSuccess: async () => {
      setEditing(false);
      setForm((f) => ({ ...f, accountNumber: '' }));
      await queryClient.invalidateQueries({ queryKey: ['franchise', 'bank-account'] });
    },
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-xl">
      <h1 className="mb-1 text-2xl font-bold">Bank account</h1>
      <p className="mb-6 text-sm text-slate-400">Your earnings are paid into this account.</p>

      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}

      {bank && !editing && (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            {bank.verified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
                <Clock className="h-3.5 w-3.5" /> Pending verification
              </span>
            )}
          </div>

          <dl className="space-y-2 text-sm">
            <Row label="Account holder" value={bank.accountHolderName} />
            <Row label="Account number" value={bank.accountNumber} />
            <Row label="IFSC" value={bank.ifsc} />
            {bank.bankName && <Row label="Bank" value={bank.bankName} />}
          </dl>

          {!bank.verified && (
            <p className="mt-4 rounded-lg bg-slate-800/70 px-3 py-2 text-xs text-slate-400">
              We&apos;re verifying this account. Payouts start once it&apos;s verified.
            </p>
          )}

          <button
            onClick={() => {
              setEditing(true);
              setForm((f) => ({ ...f, accountNumber: '' }));
            }}
            className="mt-4 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
          >
            Change account
          </button>
        </div>
      )}

      {(!bank || editing) && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
        >
          <input className={INPUT} placeholder="Account holder name" value={form.accountHolderName} onChange={set('accountHolderName')} required />
          <input className={INPUT} inputMode="numeric" placeholder="Account number" value={form.accountNumber} onChange={set('accountNumber')} required />
          <input className={INPUT} placeholder="IFSC (e.g. HDFC0001234)" value={form.ifsc} onChange={set('ifsc')} required />
          <input className={INPUT} placeholder="Bank name (optional)" value={form.bankName} onChange={set('bankName')} />

          {/* Say this plainly: a changed account has not been checked yet, and we
              will not pay into it until it has been. */}
          {bank && (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
              Changing your account means it must be verified again before your next payout.
            </p>
          )}

          {save.isError && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {(save.error as Error).message}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-lg bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              {save.isPending ? 'Saving…' : 'Save account'}
            </button>
            {bank && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:border-slate-500"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-200">{value}</dd>
    </div>
  );
}

export default function BankAccountPage() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <BankAccountInner />
    </QueryClientProvider>
  );
}

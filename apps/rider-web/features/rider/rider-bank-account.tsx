'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBankAccount, saveBankAccount, type RiderBankAccount } from '@/lib/api';

const INPUT =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none';

export function RiderBankAccountScreen({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ accountHolderName: '', accountNumber: '', ifsc: '', bankName: '', upiId: '' });
  const [editing, setEditing] = useState(false);

  const { data: bank, isLoading } = useQuery<RiderBankAccount | null>({
    queryKey: ['rider', 'bank-account'],
    queryFn: getBankAccount,
  });

  useEffect(() => {
    if (bank && !editing) {
      setForm({
        accountHolderName: bank.accountHolderName,
        accountNumber: '',
        ifsc: bank.ifsc,
        bankName: bank.bankName ?? '',
        upiId: bank.upiId ?? '',
      });
    }
  }, [bank, editing]);

  const save = useMutation({
    mutationFn: () =>
      saveBankAccount({
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        ifsc: form.ifsc.trim().toUpperCase(),
        bankName: form.bankName.trim() || undefined,
        upiId: form.upiId.trim() || undefined,
      }),
    onSuccess: async () => {
      setEditing(false);
      setForm((f) => ({ ...f, accountNumber: '' }));
      await qc.invalidateQueries({ queryKey: ['rider', 'bank-account'] });
    },
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="mx-auto min-h-screen max-w-md bg-slate-100 pb-10">
      <header className="sticky top-0 z-10 bg-slate-950 px-4 py-3 text-white">
        <button onClick={onBack} className="text-xs text-slate-400 underline">
          ‹ Back
        </button>
        <p className="mt-1 font-semibold">Payout account</p>
        <p className="text-xs text-slate-400">Your weekly earnings are paid into this account.</p>
      </header>

      <div className="space-y-4 p-4">
        {isLoading && <p className="text-sm text-slate-500">Loading…</p>}

        {bank && !editing && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-3">
              {bank.verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  ✓ Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  ⏳ Pending verification
                </span>
              )}
            </div>

            <dl className="space-y-2 text-sm">
              <Row label="Account holder" value={bank.accountHolderName} />
              <Row label="Account number" value={bank.accountNumber} />
              <Row label="IFSC" value={bank.ifsc} />
              {bank.bankName && <Row label="Bank" value={bank.bankName} />}
              {bank.upiId && <Row label="UPI" value={bank.upiId} />}
            </dl>

            {!bank.verified && (
              <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-500">
                We&apos;re verifying this account. Payouts start once it&apos;s verified.
              </p>
            )}

            <button
              onClick={() => {
                setEditing(true);
                setForm((f) => ({ ...f, accountNumber: '' }));
              }}
              className="mt-3 text-xs font-semibold text-emerald-600"
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
            className="space-y-3 rounded-xl bg-white p-4 shadow-sm"
          >
            <input className={INPUT} placeholder="Account holder name" value={form.accountHolderName} onChange={set('accountHolderName')} required />
            <input className={INPUT} inputMode="numeric" placeholder="Account number" value={form.accountNumber} onChange={set('accountNumber')} required />
            <input className={INPUT} placeholder="IFSC (e.g. HDFC0001234)" value={form.ifsc} onChange={set('ifsc')} required />
            <input className={INPUT} placeholder="Bank name (optional)" value={form.bankName} onChange={set('bankName')} />
            <input className={INPUT} placeholder="UPI ID (optional)" value={form.upiId} onChange={set('upiId')} />

            {/* A changed account has not been checked yet, and we will not pay into
                it until it has been. Say that plainly. */}
            {bank && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Changing your account means it must be verified again before your next payout.
              </p>
            )}

            {save.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {(save.error as Error).message}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={save.isPending}
                className="h-11 flex-1 rounded-lg bg-emerald-500 text-sm font-semibold text-white disabled:opacity-50"
              >
                {save.isPending ? 'Saving…' : 'Save account'}
              </button>
              {bank && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="h-11 flex-1 rounded-lg border border-slate-300 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}

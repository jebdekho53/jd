'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getBankAccount, saveBankAccount, type RiderBankAccount } from '@/lib/api';

const INPUT =
  'w-full rounded-xl border border-rider-border bg-rider-bg px-3 py-2.5 text-sm text-rider-text placeholder:text-rider-muted focus:border-rider-accent focus:outline-none';

export function RiderBankAccountScreen({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ accountHolderName: '', accountNumber: '', ifsc: '', bankName: '', upiId: '', email: '' });
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
        email: '',
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
        email: form.email.trim() || undefined,
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
    <div className="mx-auto min-h-screen max-w-md bg-rider-bg pb-10 text-rider-text">
      <header className="sticky top-0 z-10 bg-rider-surface2 px-4 py-3">
        <button onClick={onBack} className="text-xs text-rider-muted underline">
          ‹ Back
        </button>
        <p className="mt-1 font-bold">Payout account</p>
        <p className="text-xs text-rider-muted">Your weekly earnings are paid into this account.</p>
      </header>

      <div className="space-y-4 p-4">
        {isLoading && <p className="text-sm text-rider-muted">Loading…</p>}

        {bank && !editing && (
          <div className="rounded-2xl border border-rider-border bg-rider-surface p-4">
            <div className="mb-3">
              {bank.verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rider-online/15 px-2.5 py-1 text-xs font-bold text-rider-online">
                  ✓ Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rider-accent/15 px-2.5 py-1 text-xs font-bold text-rider-accent">
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
              <p className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs text-rider-muted">
                We&apos;re verifying this account. Payouts start once it&apos;s verified.
              </p>
            )}

            <button
              onClick={() => {
                setEditing(true);
                setForm((f) => ({ ...f, accountNumber: '' }));
              }}
              className="mt-3 text-xs font-bold text-rider-accent"
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
            className="space-y-3 rounded-2xl border border-rider-border bg-rider-surface p-4"
          >
            <input className={INPUT} placeholder="Account holder name" value={form.accountHolderName} onChange={set('accountHolderName')} required />
            <input className={INPUT} inputMode="numeric" placeholder="Account number" value={form.accountNumber} onChange={set('accountNumber')} required />
            <input className={INPUT} placeholder="IFSC (e.g. HDFC0001234)" value={form.ifsc} onChange={set('ifsc')} required />
            <input className={INPUT} placeholder="Bank name (optional)" value={form.bankName} onChange={set('bankName')} />
            <input className={INPUT} placeholder="UPI ID (optional)" value={form.upiId} onChange={set('upiId')} />
            <input className={INPUT} type="email" placeholder="Email (required to verify payouts)" value={form.email} onChange={set('email')} />
            <p className="-mt-1 text-xs text-rider-muted">
              We only ask once — needed to set up your payout account. Skip this if you&apos;ve already given us one.
            </p>

            {/* A changed account has not been checked yet, and we will not pay into
                it until it has been. Say that plainly. */}
            {bank && (
              <p className="rounded-xl bg-rider-accent/10 px-3 py-2 text-xs text-rider-accent">
                Changing your account means it must be verified again before your next payout.
              </p>
            )}

            {save.isError && (
              <p className="rounded-xl bg-rider-danger/10 px-3 py-2 text-sm text-rider-danger">
                {(save.error as Error).message}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={save.isPending}
                className="h-12 flex-1 rounded-xl bg-rider-accent text-sm font-bold text-rider-accent-foreground disabled:opacity-50"
              >
                {save.isPending ? 'Saving…' : 'Save account'}
              </button>
              {bank && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="h-12 flex-1 rounded-xl border border-rider-border text-sm font-bold text-rider-text"
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
      <dt className="text-rider-muted">{label}</dt>
      <dd className="font-semibold text-rider-text">{value}</dd>
    </div>
  );
}

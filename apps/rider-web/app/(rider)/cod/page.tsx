'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPendingCod, submitCod } from '@/lib/api';
import { CaptainPageShell, Panel } from '@/features/rider/captain-page-shell';
import { Button, EmptyState } from '@/design-system/primitives';

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export default function CodPage() {
  const qc = useQueryClient();
  const cod = useQuery({ queryKey: ['rider', 'finance', 'cod'], queryFn: getPendingCod });
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [amountInput, setAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);

  const items = cod.data?.items ?? [];
  const selected = useMemo(() => items.filter((item) => !excluded.has(item.orderId)), [items, excluded]);
  const expected = useMemo(() => selected.reduce((sum, item) => sum + item.amount, 0), [selected]);

  // Blank input means "depositing exactly what is expected" — riders should not have
  // to retype the number for the normal full-deposit case.
  const deposited = amountInput.trim() === '' ? expected : Number(amountInput);
  const amountValid = Number.isFinite(deposited) && deposited >= 0;
  const mismatch = amountValid ? Math.round((deposited - expected) * 100) / 100 : 0;

  const toggle = (orderId: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const remit = useMutation({
    mutationFn: () => submitCod(selected.map((item) => item.orderId), deposited, notes.trim() || undefined),
    onSuccess: () => {
      setReceipt(`Submitted ${inr(deposited)} for ${selected.length} order${selected.length === 1 ? '' : 's'}.`);
      setExcluded(new Set());
      setAmountInput('');
      setNotes('');
      setError(null);
      qc.invalidateQueries({ queryKey: ['rider', 'finance', 'cod'] });
      qc.invalidateQueries({ queryKey: ['rider', 'finance', 'earnings'] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not submit COD deposit'),
  });

  const submit = () => {
    setReceipt(null);
    if (selected.length === 0) {
      setError('Select at least one order to deposit against');
      return;
    }
    if (!amountValid) {
      setError('Enter a valid deposit amount');
      return;
    }
    setError(null);
    remit.mutate();
  };

  return (
    <CaptainPageShell title="COD deposit" subtitle="Cash you collected and still owe JebDekho.">
      <Panel title="Cash in hand">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-black text-rider-accent">{inr(cod.data?.totalToDeposit ?? 0)}</p>
            <p className="mt-1 text-sm text-rider-muted">
              across {cod.data?.count ?? 0} order{cod.data?.count === 1 ? '' : 's'}
            </p>
          </div>
          {cod.isFetching && <span className="text-xs text-rider-muted">Refreshing…</span>}
        </div>
      </Panel>

      {receipt && (
        <p className="rounded-xl bg-rider-online/10 p-3 text-sm font-semibold text-rider-online">{receipt}</p>
      )}

      {cod.isError ? (
        <EmptyState title="Could not load COD" body="Check your connection and pull down to retry." />
      ) : cod.isLoading ? (
        <p className="text-sm text-rider-muted">Loading COD orders…</p>
      ) : items.length === 0 ? (
        <EmptyState title="Nothing to deposit" body="COD cash you collect on deliveries will show up here." />
      ) : (
        <>
          <Panel title="Orders in this deposit">
            <ul className="space-y-2">
              {items.map((item) => {
                const included = !excluded.has(item.orderId);
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggle(item.orderId)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left text-sm ${
                        included ? 'border border-rider-accent/40 bg-rider-accent/10' : 'bg-white/5 opacity-60'
                      }`}
                    >
                      <span>
                        <b className="text-rider-text">{item.orderNumber ?? item.orderId.slice(0, 8)}</b>
                        <span className="block text-xs text-rider-muted">
                          Collected {new Date(item.collectedAt).toLocaleString('en-IN')}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <b className="text-rider-text">{inr(item.amount)}</b>
                        <span className="block text-xs text-rider-muted">{included ? 'Included' : 'Excluded'}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Submit deposit">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-rider-text">
                <span className="text-rider-muted">Expected for selected orders</span>
                <b>{inr(expected)}</b>
              </div>
              <label className="block text-sm text-rider-muted">
                Amount actually deposited
                <input
                  inputMode="decimal"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder={String(Math.round(expected))}
                  className="mt-1 h-11 w-full rounded-xl border border-rider-border bg-rider-bg px-3 text-sm text-rider-text"
                />
              </label>
              {amountValid && mismatch !== 0 && (
                <p className="rounded-xl bg-rider-danger/10 p-3 text-xs text-rider-danger">
                  {mismatch > 0 ? 'Over' : 'Short'} by {inr(Math.abs(mismatch))}. Finance will review this
                  mismatch — add a note explaining it.
                </p>
              )}
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Deposit note or bank reference"
                className="h-11 w-full rounded-xl border border-rider-border bg-rider-bg px-3 text-sm text-rider-text"
              />
              <Button onClick={submit} disabled={remit.isPending}>
                {remit.isPending ? 'Submitting…' : `Submit ${inr(amountValid ? deposited : 0)}`}
              </Button>
              {error && <p className="rounded-xl bg-rider-danger/10 p-3 text-sm text-rider-danger">{error}</p>}
            </div>
          </Panel>
        </>
      )}
    </CaptainPageShell>
  );
}

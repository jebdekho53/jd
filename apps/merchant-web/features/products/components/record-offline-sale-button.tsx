'use client';

import { useState } from 'react';
import { PackageMinus } from 'lucide-react';
import { Modal, Button, Input, Textarea, useToast } from '@/design-system/primitives';
import { useRecordOfflineSaleMutation } from '@/hooks/use-inventory';

interface Props {
  storeId: string;
  productId: string;
  variantId?: string;
  productName: string;
}

/** Jebdekho only ever learns about sales that go through it — a merchant
 *  selling the same stock in-store has no way to tell the online listing
 *  that inventory dropped, so available stock silently drifts from actual
 *  stock until an online order oversells against units that are already
 *  gone. This is a purpose-built "I sold N units offline" action instead of
 *  making the merchant compute a new absolute total themselves. */
export function RecordOfflineSaleButton({ storeId, productId, variantId, productName }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const { mutate, isPending } = useRecordOfflineSaleMutation(storeId, productId);

  const close = () => { setOpen(false); setQty(''); setNote(''); };

  const submit = () => {
    const quantitySold = Number(qty);
    if (!Number.isInteger(quantitySold) || quantitySold < 1) return;
    mutate(
      { payload: { quantitySold, note: note.trim() || undefined }, variantId },
      {
        onSuccess: (result) => {
          if (result.shortfall > 0) {
            toast(
              `Stock set to 0 — you reported ${result.shortfall} more unit(s) sold than were shown available. This variant's online and physical stock were already out of sync; consider a full recount.`,
              'error',
            );
          } else {
            toast(`Recorded ${quantitySold} offline sale(s) — stock now ${result.availableQty}`, 'success');
          }
          close();
        },
        onError: (err) => toast((err as Error).message, 'error'),
      },
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Record an in-store (offline) sale"
        className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      >
        <PackageMinus className="h-3.5 w-3.5" />
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Record offline sale"
        description={productName}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={close} disabled={isPending}>Cancel</Button>
            <Button onClick={submit} disabled={isPending || !qty}>Record sale</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Units sold in-store</span>
            <Input
              autoFocus
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 5"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Note (optional)</span>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Walk-in customer, cash sale"
              rows={2}
            />
          </label>
          <p className="text-xs text-slate-500">
            This lowers the stock shown to online buyers by the amount entered. Use it every time you
            sell this item in-store so online orders don&apos;t oversell against stock that&apos;s already gone.
          </p>
        </div>
      </Modal>
    </>
  );
}

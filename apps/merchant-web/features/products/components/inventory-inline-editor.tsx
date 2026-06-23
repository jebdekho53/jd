'use client';

import { useState } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUpdateInventoryMutation } from '@/hooks/use-inventory';
import { useToast } from '@/design-system/primitives';

interface Props {
  storeId: string;
  productId: string;
  variantId?: string;
  currentQty: number;
}

export function InventoryInlineEditor({ storeId, productId, variantId, currentQty }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(currentQty));
  const { mutate, isPending } = useUpdateInventoryMutation(storeId, productId);

  const confirm = () => {
    const qty = Number(val);
    if (isNaN(qty) || qty < 0) return;
    mutate(
      { payload: { quantity: qty }, variantId },
      {
        onSuccess: () => { setEditing(false); toast('Stock updated', 'success'); },
        onError: (err) => { toast((err as Error).message, 'error'); setVal(String(currentQty)); setEditing(false); },
      },
    );
  };

  const cancel = () => { setVal(String(currentQty)); setEditing(false); };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex items-center gap-1.5 rounded px-2 py-0.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        {currentQty}
        <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        type="number"
        min={0}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); }}
        className="h-7 w-16 rounded border border-brand-400 px-2 text-sm outline-none focus:ring-2 focus:ring-brand-100"
        disabled={isPending}
      />
      <button
        type="button"
        onClick={confirm}
        disabled={isPending}
        className="flex h-7 w-7 items-center justify-center rounded bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={cancel}
        className="flex h-7 w-7 items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

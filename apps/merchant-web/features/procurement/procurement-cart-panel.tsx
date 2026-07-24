'use client';

import { useState } from 'react';
import { Button, useToast } from '@/design-system/primitives';
import {
  useCreateOrderMutation,
  useProcurementCartQuery,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from '@/hooks/use-procurement';

export function ProcurementCartPanel({ storeId, onOrderPlaced }: { storeId: string; onOrderPlaced: () => void }) {
  const { data: cart, isLoading } = useProcurementCartQuery(storeId);
  const updateItem = useUpdateCartItemMutation(storeId);
  const removeItem = useRemoveCartItemMutation(storeId);
  const createOrder = useCreateOrderMutation(storeId);
  const { toast } = useToast();
  const [notes, setNotes] = useState('');

  if (isLoading) return <p className="text-sm text-slate-500">Loading cart...</p>;

  const items = cart?.items ?? [];
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Your procurement cart is empty. Add products from the Marketplace tab.</p>;
  }

  const vendorName = items[0].vendorProduct.vendor.businessName;
  let subtotal = 0;
  let tax = 0;
  for (const item of items) {
    const line = item.unitPrice * item.quantity;
    subtotal += line;
    tax += line * (item.vendorProduct.gstRate / 100);
  }
  const total = subtotal + tax;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Supplier: <span className="font-medium text-slate-800">{vendorName}</span>
      </p>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 text-sm"
          >
            <div>
              <p className="font-medium">{item.vendorProduct.name}</p>
              <p className="text-xs text-slate-500">
                MOQ {item.vendorProduct.moq} · ₹{item.unitPrice.toLocaleString()} / {item.vendorProduct.unit ?? 'unit'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={item.vendorProduct.moq}
                value={item.quantity}
                onChange={(e) => {
                  const q = Number(e.target.value);
                  if (!Number.isFinite(q) || q < item.vendorProduct.moq) return;
                  updateItem.mutate({ cart: cart!, vendorProductId: item.vendorProductId, quantity: q });
                }}
                className="w-20 rounded-lg border px-2 py-1 text-sm"
              />
              <p className="w-24 text-right font-medium">₹{(item.unitPrice * item.quantity).toLocaleString()}</p>
              <button
                type="button"
                onClick={() => removeItem.mutate({ cart: cart!, vendorProductId: item.vendorProductId })}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white p-4 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>GST</span>
          <span>₹{tax.toLocaleString()}</span>
        </div>
        <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
          <span>Total</span>
          <span>₹{total.toLocaleString()}</span>
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes for the supplier (optional)"
        rows={2}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      />

      {createOrder.error && (
        <p className="text-sm text-red-600">{(createOrder.error as Error).message}</p>
      )}

      <Button
        loading={createOrder.isPending}
        onClick={() =>
          createOrder.mutate(
            { notes: notes || undefined },
            {
              onSuccess: (order) => {
                toast(`Order ${order.orderNumber} placed`, 'success');
                setNotes('');
                onOrderPlaced();
              },
            },
          )
        }
      >
        Place order
      </Button>
    </div>
  );
}

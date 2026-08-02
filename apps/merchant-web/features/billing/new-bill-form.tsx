'use client';

import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { Button, Card, CardBody, Input, Textarea, useToast } from '@/design-system/primitives';
import { useProductsQuery } from '@/hooks/use-products';
import { useCreateOfflineBillMutation } from '@/hooks/use-billing';
import type { Product, ProductVariant } from '@/types/product';

interface LineItem {
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPrice: number;
  availableQty: number;
  quantity: number;
}

const PHONE_REGEX = /^[6-9]\d{9}$/;

export function NewBillForm({ storeId, onDone }: { storeId: string; onDone: () => void }) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [note, setNote] = useState('');

  const { data } = useProductsQuery(storeId, { search: search.trim() || undefined, limit: 10 });
  const results = search.trim() ? (data?.data ?? []) : [];
  const { mutate, isPending } = useCreateOfflineBillMutation(storeId);

  function addLine(product: Product, variant: ProductVariant) {
    setLines((prev) => {
      if (prev.some((l) => l.variantId === variant.id)) return prev;
      return [
        ...prev,
        {
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          sku: variant.sku,
          unitPrice: variant.price,
          availableQty: variant.inventory?.availableQty ?? 0,
          quantity: 1,
        },
      ];
    });
    setSearch('');
  }

  function updateQty(variantId: string, quantity: number) {
    setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)));
  }

  function removeLine(variantId: string) {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const phoneValid = PHONE_REGEX.test(customerPhone);
  const canSubmit = lines.length > 0 && phoneValid && lines.every((l) => l.quantity >= 1);

  function submit() {
    mutate(
      {
        customerPhone,
        customerName: customerName.trim() || undefined,
        note: note.trim() || undefined,
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      },
      {
        onSuccess: (bill) => {
          const shortfall = bill.shortfallTotal ?? 0;
          const amount = Number(bill.totalAmount).toFixed(2);
          if (shortfall > 0) {
            toast(
              `Bill created for ₹${amount} — ${shortfall} unit(s) across this bill were sold beyond tracked stock. Consider a recount.`,
              'error',
            );
          } else {
            toast(`Bill created for ₹${amount}`, 'success');
          }
          setLines([]);
          setCustomerPhone('');
          setCustomerName('');
          setNote('');
          onDone();
        },
        onError: (err) => toast((err as Error).message, 'error'),
      },
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="relative">
          <label className="mb-1 block text-sm font-medium text-slate-700">Add items</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or SKU"
            />
          </div>
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {results.map((product) => (
                <div key={product.id} className="border-b border-slate-100 last:border-0">
                  <div className="px-3 pt-2 text-xs font-medium text-slate-500">{product.name}</div>
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => addLine(product, variant)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span>
                        {variant.name} <span className="text-slate-400">({variant.sku})</span>
                      </span>
                      <span className="text-slate-500">
                        ₹{variant.price} · stock {variant.inventory?.availableQty ?? 0}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.variantId} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      {line.productName} <span className="text-slate-400">({line.variantName})</span>
                      {line.quantity > line.availableQty && (
                        <span className="ml-2 text-xs text-amber-600">only {line.availableQty} tracked</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => updateQty(line.variantId, Math.max(1, Number(e.target.value) || 1))}
                        className="w-20"
                      />
                    </td>
                    <td className="px-3 py-2">₹{line.unitPrice}</td>
                    <td className="px-3 py-2">₹{(line.unitPrice * line.quantity).toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeLine(line.variantId)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 font-medium">
                  <td className="px-3 py-2" colSpan={3}>Total</td>
                  <td className="px-3 py-2">₹{total.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Customer phone</span>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
            />
            {customerPhone.length > 0 && !phoneValid && (
              <span className="mt-1 block text-xs text-red-600">Enter a valid 10-digit Indian mobile number</span>
            )}
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Customer name (optional)</span>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Ramesh" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Note (optional)</span>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. Cash sale" />
        </label>

        <div className="flex justify-end">
          <Button onClick={submit} disabled={!canSubmit || isPending}>
            Create bill
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

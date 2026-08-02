'use client';

import { Download, MessageCircle } from 'lucide-react';
import { Modal, Button } from '@/design-system/primitives';
import type { OfflineBill } from '@/types/billing';

interface Props {
  bill: OfflineBill | null;
  storeId: string;
  onClose: () => void;
}

export function BillDetailModal({ bill, storeId, onClose }: Props) {
  if (!bill) return null;

  const pdfHref = `/api/merchant/stores/${storeId}/offline-bills/${bill.id}/pdf`;
  const publicPdfUrl = `${process.env.NEXT_PUBLIC_API_ORIGIN ?? ''}/api/v1/public/offline-bills/${bill.shareToken}/pdf`;
  const waMessage =
    `Namaste! Aapka bill ready hai — total ₹${Number(bill.totalAmount).toFixed(2)}.\n` +
    `Invoice dekhein: ${publicPdfUrl}`;
  const waHref = `https://wa.me/91${bill.customerPhone}?text=${encodeURIComponent(waMessage)}`;

  return (
    <Modal
      open={Boolean(bill)}
      onClose={onClose}
      title="Bill details"
      description={new Date(bill.createdAt).toLocaleString('en-IN')}
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between">
          <a href={pdfHref} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </a>
          <a href={waHref} target="_blank" rel="noopener noreferrer">
            <Button>
              <MessageCircle className="h-4 w-4" /> Send via WhatsApp
            </Button>
          </a>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-700">Customer</p>
          <p className="text-sm text-slate-600">
            {bill.customerName || 'Walk-in customer'} · {bill.customerPhone}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Qty</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    {item.productName} <span className="text-slate-400">({item.variantName})</span>
                    <span className="ml-1 font-mono text-xs text-slate-400">{item.sku}</span>
                    {item.shortfall > 0 && (
                      <span className="ml-2 text-xs text-amber-600">shortfall {item.shortfall}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">{item.quantity}</td>
                  <td className="px-3 py-2">₹{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="px-3 py-2">₹{Number(item.lineTotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 font-medium">
                <td className="px-3 py-2" colSpan={3}>Total</td>
                <td className="px-3 py-2">₹{Number(bill.totalAmount).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {bill.note && <p className="text-sm text-slate-500">Note: {bill.note}</p>}
      </div>
    </Modal>
  );
}

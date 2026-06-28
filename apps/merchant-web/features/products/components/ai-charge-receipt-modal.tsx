'use client';

import { Modal, Button } from '@/design-system/primitives';
import type { AiChargeReceipt } from '@/services/products/product-creation-api';

interface Props {
  receipt: AiChargeReceipt | null;
  onClose: () => void;
}

export function AiChargeReceiptModal({ receipt, onClose }: Props) {
  if (!receipt) return null;

  return (
    <Modal open={Boolean(receipt)} onClose={onClose} title="AI Product Charge Receipt" size="sm">
      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-medium text-emerald-900">Charge successful</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">
            ₹{receipt.amountRupee.toFixed(2)}
          </p>
        </div>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-slate-500">Product</dt>
            <dd className="font-medium">{receipt.productName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Analysis ID</dt>
            <dd className="font-mono text-xs">{receipt.analysisId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Status</dt>
            <dd>{receipt.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Charged at</dt>
            <dd>{new Date(receipt.chargedAt).toLocaleString()}</dd>
          </div>
        </dl>
        <p className="text-xs text-slate-500">
          This charge applies only to AI-confirmed product creation. Manual and CSV uploads remain free.
        </p>
        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}

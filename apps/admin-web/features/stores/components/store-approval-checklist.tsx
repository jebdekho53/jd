'use client';

import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import type { AdminStoreDetail } from '@/types/store';

interface CheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail?: string;
}

function buildChecklist(store: AdminStoreDetail): CheckItem[] {
  const mp = store.merchantProfile;
  const docs = store.verificationDocuments ?? [];
  const hasGstDoc = docs.some((d) => d.documentType === 'GST_CERTIFICATE');
  const hasPanDoc = docs.some((d) => d.documentType === 'PAN_CARD');
  const hasBankDoc = docs.some((d) => d.documentType === 'BANK_PROOF');

  return [
    {
      id: 'gst',
      label: 'GST verified',
      passed: Boolean(mp.gstNumber) && (mp.kycStatus === 'VERIFIED' || hasGstDoc),
      detail: mp.gstNumber ?? 'Missing GSTIN',
    },
    {
      id: 'pan',
      label: 'PAN verified',
      passed: Boolean(mp.panNumber) && hasPanDoc,
      detail: mp.panNumber ?? 'Missing PAN',
    },
    {
      id: 'bank',
      label: 'Bank verified',
      passed: hasBankDoc,
      detail: hasBankDoc ? 'Bank proof uploaded' : 'Awaiting bank proof',
    },
    {
      id: 'address',
      label: 'Address verified',
      passed: Boolean(store.line1 && store.pincode && store.latitude && store.longitude),
      detail: `${store.line1}, ${store.pincode}`,
    },
    {
      id: 'categories',
      label: 'Categories approved',
      passed: (store._count?.products ?? 0) > 0 || (store.storeZones?.length ?? 0) > 0,
      detail: `${store._count?.products ?? 0} products · ${store.storeZones?.length ?? 0} zones`,
    },
    {
      id: 'coverage',
      label: 'Delivery coverage reviewed',
      passed: Boolean(store.pincode),
      detail: `Primary pincode ${store.pincode}`,
    },
  ];
}

export function StoreApprovalChecklist({ store }: { store: AdminStoreDetail }) {
  const items = buildChecklist(store);
  const passed = items.filter((i) => i.passed).length;
  const pct = Math.round((passed / items.length) * 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Approval checklist</h2>
        <span className="text-sm font-medium text-slate-600">{pct}% complete</span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm">
            {item.passed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
            )}
            <div>
              <p className="font-medium text-slate-800">{item.label}</p>
              {item.detail && <p className="text-xs text-slate-500">{item.detail}</p>}
            </div>
          </li>
        ))}
      </ul>
      {pct < 100 && (
        <p className="mt-3 flex items-center gap-1 text-xs text-amber-700">
          <XCircle className="h-3.5 w-3.5" />
          Resolve pending items before approval when possible.
        </p>
      )}
    </div>
  );
}

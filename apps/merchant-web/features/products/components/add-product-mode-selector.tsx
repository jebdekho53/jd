'use client';

import { FileSpreadsheet, PenLine, Sparkles } from 'lucide-react';
import { Modal, Button } from '@/design-system/primitives';

export type AddProductMode = 'manual' | 'csv' | 'ai';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: AddProductMode) => void;
}

const OPTIONS = [
  {
    id: 'manual' as const,
    label: 'Add manually',
    badge: 'Free',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    description: 'Create product by filling details yourself.',
    icon: PenLine,
  },
  {
    id: 'csv' as const,
    label: 'Upload CSV',
    badge: 'Free',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    description: 'Bulk upload products using template.',
    icon: FileSpreadsheet,
  },
  {
    id: 'ai' as const,
    label: 'Add with AI',
    badge: '₹1.50 / product',
    badgeClass: 'bg-amber-100 text-amber-800',
    description: 'Upload product photo. AI extracts product details. Pay only after confirmation.',
    icon: Sparkles,
  },
];

export function AddProductModeSelector({ open, onClose, onSelect }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Add Product" size="md">
      <p className="mb-4 text-sm text-slate-500">Choose how you want to add products to your catalog.</p>
      <div className="space-y-3">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              onSelect(opt.id);
              onClose();
            }}
            className="flex w-full items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/40"
          >
            <opt.icon className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900">{opt.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${opt.badgeClass}`}>
                  {opt.badge}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </Modal>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Textarea } from '@/design-system/primitives';
import type { CatalogCategory } from '@/types/category-governance';

interface Props {
  open: boolean;
  catalog: CatalogCategory[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (categoryId: string, subcategoryId: string, reason?: string) => void;
}

export function RequestCategoryModal({ open, catalog, loading, onClose, onSubmit }: Props) {
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [note, setNote] = useState('');

  const selectedParent = catalog.find((c) => c.id === categoryId);
  const subcategories = selectedParent?.children ?? [];

  useEffect(() => {
    if (!categoryId) setSubcategoryId('');
  }, [categoryId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request category access"
      description={
        catalog[0]?.catalogKind === 'MENU'
          ? 'Select a menu category and subcategory (e.g. Food → Biryani, Cafe → Coffee). Admin approval is required before you can add menu items.'
          : 'Select a category and subcategory. Admin approval is required before you can add products.'
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            loading={loading}
            disabled={!categoryId || !subcategoryId}
            onClick={() => onSubmit(categoryId, subcategoryId, note.trim() || undefined)}
          >
            Submit request
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select category…</option>
            {catalog.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Subcategory</label>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            disabled={!categoryId}
          >
            <option value="">Select subcategory…</option>
            {subcategories.map((ch) => (
              <option
                key={ch.id}
                value={ch.id}
                disabled={ch.requestStatus === 'APPROVED' || ch.requestStatus === 'PENDING'}
              >
                {ch.name}
                {ch.requestStatus === 'APPROVED' ? ' (approved)' : ''}
                {ch.requestStatus === 'PENDING' ? ' (pending)' : ''}
              </option>
            ))}
          </select>
        </div>
        <Textarea
          label="Note for admin (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. We sell organic snacks and namkeen"
        />
      </div>
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { Modal, Button, Textarea } from '@/design-system/primitives';
import type { CatalogNode } from '@/types/category-governance';

interface Props {
  open: boolean;
  catalog: CatalogNode[];
  loading: boolean;
  onClose: () => void;
  onSubmit: (categoryId: string, subcategoryId: string, reason?: string) => void;
}

const LEVEL_LABELS = ['Category', 'Subcategory', 'Sub-category', 'Product type'];

export function RequestCategoryModal({ open, catalog, loading, onClose, onSubmit }: Props) {
  // One selected node id per level; deeper levels are cleared when a level changes.
  const [path, setPath] = useState<string[]>([]);
  const [note, setNote] = useState('');

  // Build the visible cascade: level 0 = roots, each next level = children of the
  // node chosen above it. Stops at the first level whose choice has no children.
  const levels: { options: CatalogNode[]; value: string }[] = [];
  let options: CatalogNode[] = catalog;
  for (let i = 0; options.length > 0; i++) {
    const value = path[i] ?? '';
    levels.push({ options, value });
    const chosen = options.find((n) => n.id === value);
    if (!chosen || chosen.children.length === 0) break;
    options = chosen.children;
  }

  const selectedId = [...path].filter(Boolean).pop() ?? '';
  const rootId = path[0] ?? '';

  const setLevel = (i: number, value: string) =>
    setPath((prev) => [...prev.slice(0, i), value].filter((_, idx) => idx <= i));

  const reset = () => { setPath([]); setNote(''); };

  const isMenu = catalog[0]?.catalogKind === 'MENU';

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Request category access"
      description={
        isMenu
          ? 'Drill down to the menu category you sell (e.g. Food → Chinese → Noodles). You can stop at any level — approval covers everything beneath it.'
          : 'Drill down to the category you sell (e.g. Grocery → Staples → Dals & Pulses → Moong Dal). You can stop at any level — approval covers everything beneath it.'
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button
            loading={loading}
            disabled={!selectedId}
            onClick={() => { onSubmit(rootId, selectedId, note.trim() || undefined); reset(); }}
          >
            Submit request
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {levels.map((level, i) => (
          <div key={i}>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {LEVEL_LABELS[i] ?? `Level ${i + 1}`}
              {i > 0 && <span className="font-normal text-slate-400"> (optional — stop at any level)</span>}
            </label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={level.value}
              onChange={(e) => setLevel(i, e.target.value)}
            >
              <option value="">{i === 0 ? 'Select category…' : 'All of the above / choose deeper…'}</option>
              {level.options.map((n) => {
                const locked = n.requestStatus === 'APPROVED' || n.requestStatus === 'PENDING';
                return (
                  <option key={n.id} value={n.id} disabled={locked}>
                    {n.name}
                    {n.children.length > 0 ? ' ›' : ''}
                    {n.requestStatus === 'APPROVED' ? ' (approved)' : ''}
                    {n.requestStatus === 'PENDING' ? ' (pending)' : ''}
                  </option>
                );
              })}
            </select>
          </div>
        ))}

        {selectedId && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">
            Requesting: <strong>{buildPathLabel(catalog, path)}</strong>
          </p>
        )}

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

/** Human-readable "Root › … › Selected" from the chosen id path. */
function buildPathLabel(catalog: CatalogNode[], path: string[]): string {
  const names: string[] = [];
  let options: CatalogNode[] = catalog;
  for (const id of path) {
    if (!id) break;
    const node = options.find((n) => n.id === id);
    if (!node) break;
    names.push(node.name);
    options = node.children;
  }
  return names.join(' › ');
}

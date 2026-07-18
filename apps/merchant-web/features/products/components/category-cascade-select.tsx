'use client';

import { useMemo } from 'react';
import { Select } from '@/design-system/primitives';

export interface CategoryNode {
  id: string;
  name: string;
  children?: CategoryNode[] | null;
}

/** Labels per level; anything deeper falls back to the last one. */
const LEVEL_LABELS = ['Category', 'Subcategory', 'Sub-subcategory', 'Product type'];

function labelForLevel(level: number): string {
  return LEVEL_LABELS[level] ?? LEVEL_LABELS[LEVEL_LABELS.length - 1];
}

/**
 * The chain of nodes from a root down to `categoryId`, or [] if not found.
 * Used both to render the selects and to restore a saved category into them.
 */
export function findCategoryPath<T extends { id: string; name: string; children?: T[] | null }>(
  roots: T[],
  categoryId: string | null | undefined,
): T[] {
  if (!categoryId) return [];
  const walk = (nodes: T[], trail: T[]): T[] | null => {
    for (const node of nodes) {
      const next = [...trail, node];
      if (node.id === categoryId) return next;
      const found = walk(node.children ?? [], next);
      if (found) return found;
    }
    return null;
  };
  return walk(roots, []) ?? [];
}

interface Props {
  /** Approved category tree (any depth). */
  categories: CategoryNode[];
  /** Currently selected category — the DEEPEST node the user picked. */
  value: string | null | undefined;
  onChange: (categoryId: string) => void;
  error?: string;
  disabled?: boolean;
  /** Marks the top level with a * — the deeper levels are always optional. */
  required?: boolean;
}

/**
 * Cascading category picker that follows the tree to whatever depth it has.
 *
 * The taxonomy is 4 levels deep today (and may grow), but the product forms used
 * to hard-code 2–3 selects, which made the deepest categories unreachable. This
 * renders one select per level for as long as the selected node still has
 * children, so no code change is needed if the taxonomy gets deeper.
 *
 * `value` is always the deepest node chosen — picking a broader level clears the
 * levels under it, so a product can never keep a stale deeper category.
 */
export function CategoryCascadeSelect({ categories, value, onChange, error, disabled, required }: Props) {
  const path = useMemo(() => findCategoryPath(categories, value), [categories, value]);

  // One select per level: level 0 = roots, then the children of what's chosen above.
  const levels = useMemo(() => {
    const out: { options: CategoryNode[]; selected: string }[] = [
      { options: categories, selected: path[0]?.id ?? '' },
    ];
    for (let i = 0; i < path.length; i++) {
      const children = path[i].children ?? [];
      if (children.length === 0) break;
      out.push({ options: children, selected: path[i + 1]?.id ?? '' });
    }
    return out;
  }, [categories, path]);

  return (
    <div className="space-y-2">
      {levels.map((level, i) => (
        <Select
          key={i}
          label={i === 0 && required ? `${labelForLevel(0)} *` : labelForLevel(i)}
          value={level.selected}
          disabled={disabled}
          error={i === 0 ? error : undefined}
          onChange={(e) => {
            const picked = e.target.value;
            // Clearing a level selects its parent (or nothing at the root), so the
            // value is always a real node the merchant can see selected.
            onChange(picked || path[i - 1]?.id || '');
          }}
        >
          <option value="">
            {i === 0 ? 'Select category' : `Select ${labelForLevel(i).toLowerCase()} (optional)`}
          </option>
          {level.options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      ))}
    </div>
  );
}

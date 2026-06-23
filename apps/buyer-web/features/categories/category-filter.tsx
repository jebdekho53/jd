'use client';

import { cn } from '@/lib/utils';
import type { CategoryItem } from '@/types/buyer';

interface CategoryFilterProps {
  categories: CategoryItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}

export function CategoryFilter({ categories, selectedId, onSelect, className }: CategoryFilterProps) {
  const flatCategories = flattenCategories(categories);

  if (flatCategories.length === 0) return null;

  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2 scrollbar-none', className)} role="tablist" aria-label="Categories">
      <button
        type="button"
        role="tab"
        aria-selected={selectedId === null}
        onClick={() => onSelect(null)}
        className={cn(
          'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
          selectedId === null
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-input bg-background hover:bg-accent',
        )}
      >
        All
      </button>
      {flatCategories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          role="tab"
          aria-selected={selectedId === cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            selectedId === cat.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background hover:bg-accent',
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}

function flattenCategories(categories: CategoryItem[]): CategoryItem[] {
  const result: CategoryItem[] = [];
  for (const cat of categories) {
    result.push(cat);
    if (cat.children.length > 0) {
      result.push(...flattenCategories(cat.children));
    }
  }
  return result;
}

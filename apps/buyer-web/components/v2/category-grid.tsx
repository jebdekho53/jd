'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Apple,
  Baby,
  Coffee,
  Cookie,
  Droplets,
  Flame,
  Leaf,
  Milk,
  ShoppingBasket,
  Wheat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryItem } from '@/types/buyer';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fruits: Leaf,
  vegetables: Leaf,
  dairy: Milk,
  beverages: Coffee,
  snacks: Cookie,
  bakery: Wheat,
  staples: ShoppingBasket,
  personal: Droplets,
  baby: Baby,
  organic: Apple,
  frozen: Flame,
};

function getCategoryIcon(slug: string) {
  const key = Object.keys(CATEGORY_ICONS).find((k) => slug.toLowerCase().includes(k));
  return key ? CATEGORY_ICONS[key] : ShoppingBasket;
}

interface CategoryGridProps {
  categories: CategoryItem[];
  className?: string;
  limit?: number;
}

export function CategoryGrid({ categories, className, limit = 10 }: CategoryGridProps) {
  const flat = flattenCategories(categories).slice(0, limit);

  if (flat.length === 0) return null;

  return (
    <div
      className={cn('grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8', className)}
      role="list"
      aria-label="Popular categories"
    >
      {flat.map((cat) => {
        const Icon = getCategoryIcon(cat.slug);
        return (
          <Link
            key={cat.id}
            href={`/search?categoryId=${cat.id}`}
            role="listitem"
            className="group flex flex-col items-center gap-2 rounded-xl border border-transparent bg-card p-2 text-center transition hover:border-border hover:shadow-sm"
          >
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-primary transition group-hover:bg-brand-500/15">
              {cat.imageUrl ? (
                <Image src={cat.imageUrl} alt="" fill className="object-cover" sizes="48px" />
              ) : (
                <Icon className="h-5 w-5" aria-hidden />
              )}
            </div>
            <span className="line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
              {cat.name}
            </span>
          </Link>
        );
      })}
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
